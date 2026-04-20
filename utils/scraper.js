const axios = require('axios');

// Common non-job domains to filter out from search results
const invalidIndicators = [
    'youtube.com',
    'pinterest.com',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'tiktok.com',
    'amazon.com/vdp',
    'linkedin.com/posts',
    'google.com/search'
];

/**
 * Validates an Apify API key by making a simple request to Apify API
 */
async function validateApifyKey(apiKey) {
    try {
        const response = await axios.get('https://api.apify.com/v2/users/me', {
            params: { token: apiKey }
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

/**
 * Runs a scrape for a specific user based on their preferences
 */
async function runUserScrape(apiKey, prefs = {}) {
    console.log('[SCRAPER] runUserScrape initiated with params:', JSON.stringify(prefs));
    
    // Support both new (plural) and old (singular) formats
    let roles = prefs.roles || (prefs.role ? [prefs.role] : []);
    let locations = prefs.locations || (prefs.location ? [prefs.location] : []);
    let workTypes = prefs.workTypes || (prefs.workType ? [prefs.workType] : []);

    // Ensure they are arrays
    if (!Array.isArray(roles)) roles = roles ? [roles] : [];
    if (!Array.isArray(locations)) locations = locations ? [locations] : [];
    if (!Array.isArray(workTypes)) workTypes = workTypes ? [workTypes] : [];

    // Fallback to defaults if empty
    if (roles.length === 0) roles = ['Software Engineer Intern'];
    if (locations.length === 0) locations = ['Remote'];
    if (workTypes.length === 0) workTypes = ['Full-time'];

    console.log('Sanitized search params:', { roles, locations, workTypes });
    
    // Map lookback to Apify timeRange
    const lookback = prefs.lookback || '24h';
    let timeRange = '';
    const lbLower = lookback.toLowerCase();
    if (lbLower.includes('hr') || lbLower.includes('day')) {
        if (lbLower.includes('30 days')) timeRange = 'month';
        else if (lbLower.includes('day') || lbLower.includes('24')) timeRange = 'day';
        else timeRange = 'day'; // Default for hours
    }
    
    console.log(`[SCRAPER] Using lookback: ${lookback} -> timeRange: ${timeRange}`);

    const rolesList = roles.join(' or ');
    const locationsList = locations.join(' or ');
    const workTypesList = workTypes.join(' or ');
    const resumeContext = prefs.resumeText ? `matching skills: ${prefs.resumeText.substring(0, 100)}` : "";

    const richPrompt = `find ${rolesList} internships in ${locationsList}. ${resumeContext}. I prefer ${workTypesList} and I'm targeting tech companies. 2024 2025.`.trim();

    console.log('[SCRAPER] Generated Prompt:', richPrompt);

    // Build search queries array
    const queries = [richPrompt]; 
    
    // Add variations for better coverage (cleaner queries)
    roles.forEach(role => {
        locations.forEach(loc => {
            const locStr = loc === 'Global' ? '' : ` in ${loc}`;
            queries.push(`${role} internship${locStr} 2025`);
        });
    });

    if (queries.length === 0) {
        console.warn('No search queries generated from params, using generic fallback.');
        queries.push('Software Engineer Internships 2024 2025');
    }

    if (queries.length > 20) {
        console.warn(`[Scraper] Too many queries (${queries.length}), capping to top 20 for performance.`);
        queries.splice(20);
    }
    
    const queriesString = queries.join('\n');
    console.log('Generated queries for Apify:', queriesString);
    
    try {
        // Run Google Search Scraper via Apify
        console.log(`[Apify] Requesting scrape for ${queries.length} queries. TimeRange: ${timeRange}`);
        console.log(`[Apify] First Query Sample: "${queries[0]}"`);

        const runResponse = await axios.post(`https://api.apify.com/v2/acts/apify~google-search-scraper/runs?token=${apiKey}`, {
            queries: queriesString,
            maxPagesPerQuery: 1,
            resultsPerPage: 10,
            mobileResults: false,
            timeRange: timeRange,
            includeUnfilteredResults: false,
            saveHtml: false,
            saveHtmlToKeyValueStore: false,
            includeAuthorInfo: false
        });

        const runId = runResponse.data.data.id;
        console.log(`Scrape started for user. Run ID: ${runId}`);

        // Wait for completion (polling - simple version for now)
        let finished = false;
        let results = [];
        
        // Wait up to 2 minutes
        const startTime = Date.now();
        while (!finished && (Date.now() - startTime < 120000)) {
            console.log(`[APIFY] Waiting for results (elapsed: ${Math.round((Date.now() - startTime)/1000)}s)...`);
            await new Promise(r => setTimeout(r, 8000));
            const statusResponse = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`);
            const status = statusResponse.data.data.status;
            console.log(`[APIFY] Polling status: ${status}`);
            
            if (status === 'SUCCEEDED') {
                finished = true;
                const datasetId = statusResponse.data.data.defaultDatasetId;
                console.log(`[APIFY] Run succeeded. Dataset: ${datasetId}`);
                
                const dataResponse = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`);
                const rawItems = dataResponse.data;
                console.log(`[APIFY] Retrieved ${rawItems.length} pages of results.`);
                
                if (rawItems.length > 0) {
                    console.log(`[DEBUG] First item sample: ${JSON.stringify(rawItems[0]).substring(0, 200)}...`);
                }
                
                results = processScraperResults(rawItems, prefs.resumeText);
                console.log(`[SCRAPER] Processing complete. Valid results: ${results.length}`);
            } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
                throw new Error(`Apify run failed: ${statusResponse.data.data.status}`);
            }
        }

        return results;
    } catch (error) {
        console.error('Scrape error:', error.message);
        throw error;
    }
}

/**
 * Processes raw Apify Google Search results into Internship objects
 */
function processScraperResults(items, resumeText) {
    const processed = [];
    const seenUrls = new Set();
    
    // Extract keywords from resume for basic matching
    const resumeKeywords = resumeText 
        ? resumeText.toLowerCase().split(/[\W_]+/).filter(w => w.length > 3)
        : [];

    items.forEach(item => {
        if (!item.organicResults) return;

        item.organicResults.forEach(res => {
            if (seenUrls.has(res.url)) return;
            
            const title = (res.title || '').toLowerCase();
            const description = (res.description || '').toLowerCase();
            const combinedText = `${title} ${description}`;

            // Expanded relevance check - focus on job content (Fix Issue where pulse returns 0 results)
            const jobTerms = [
                'intern', 'internship', 'co-op', 'coop', 'apprentice',
                'trainee', 'junior', 'entry', 'graduate', 'fresh', 'scholar',
                'role', 'position', 'opportunity', 'apply', 'hiring', 'join',
                'software', 'engineer', 'developer', 'analyst', 'designer',
                'program', 'student', 'fellowship', 'early career', '2024', '2025'
            ];
            
            const hasJobTerms = jobTerms.some(term => combinedText.includes(term));
            
            const isInvalidSource = invalidIndicators.some(ind => res.url.includes(ind));
            
            if (isInvalidSource) {
                console.log(`[DEBUG] Skipping invalid source: ${res.url}`);
                return;
            }

            // More inclusive check: if it's from Google organic results and hasn't been blocked yet
            // we at least check if it looks like a job
            if (!hasJobTerms && !title.includes('intern') && !title.includes('career') && !title.includes('job')) {
                // console.log(`[DEBUG] Skipping non-job result: ${res.title}`);
                return;
            }


            seenUrls.add(res.url);

            const company = extractCompanyFromTitle(res.title, res.url);
            
            // Extract clean domain for logo fetching
            let domain = 'web';
            try {
                const urlObj = new URL(res.url);
                domain = urlObj.hostname.replace('www.', '');
            } catch (e) {}

            // Basic matching score (Fix Issue #11)
            let matchScore = 0;
            if (resumeKeywords.length > 0) {
                const matches = resumeKeywords.filter(k => combinedText.includes(k));
                matchScore = Math.round((matches.length / resumeKeywords.length) * 100);
            }

            processed.push({
                id: Math.random().toString(36).substr(2, 9),
                title: res.title,
                company: company,
                domain: domain,
                url: res.url,
                description: res.description || 'No description available.',
                source: res.displayedUrl || 'Web Search',
                scrapedAt: new Date().toISOString(),
                matchScore: matchScore
            });
        });
    });

    return processed;
}

function extractCompanyFromTitle(title, url) {
    if (!title) return extractCompanyFromUrl(url);

    // Patterns for "Job at Company", "Company - Job", "Job | Company"
    const cleanTitle = title.split('...')[0].trim(); // Remove search ellipsis
    const blacklist = ['remote', 'intern', 'apply', 'hiring', 'jobs', 'careers', 'india', 'united states', 'usa'];
    
    const isClean = (name) => {
        if (!name) return false;
        const low = name.toLowerCase();
        return name.length > 2 && name.length < 30 && !blacklist.some(b => low.includes(b));
    };

    // Try "at [Company]" - Highest confidence
    const atMatch = cleanTitle.match(/at\s+([^|-]+)/i);
    if (atMatch && atMatch[1]) {
        const name = atMatch[1].trim();
        if (isClean(name)) return name;
    }

    // Try "[Company] is hiring"
    const isHiringMatch = cleanTitle.match(/([^|-]+)\s+is\s+hiring/i);
    if (isHiringMatch && isHiringMatch[1]) {
        const name = isHiringMatch[1].trim();
        if (isClean(name)) return name;
    }

    // Try separators: Title | Company or Company - Title
    const parts = cleanTitle.split(/[|-]/);
    if (parts.length > 1) {
        // Find the best part that isn't a job title
        for (const part of parts) {
            const candidate = part.trim();
            if (isClean(candidate)) return candidate;
        }
    }

    return extractCompanyFromUrl(url);
}

function extractCompanyFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        const parts = hostname.split('.');
        if (parts.length > 1) {
            const name = parts[parts.length - 2];
            // Filter out common hosting/job board domains
            const ignored = ['lever', 'greenhouse', 'workday', 'ashbyhq', 'jobs'];
            if (ignored.includes(name.toLowerCase())) {
                return name.charAt(0).toUpperCase() + name.slice(1);
            }
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
    } catch (e) {}
    return 'Company';
}

module.exports = {
    validateApifyKey,
    runUserScrape,
    extractCompanyFromTitle
};
