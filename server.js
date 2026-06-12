require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const { body, validationResult } = require('express-validator');
const admin = require('./lib/firebase-admin');
const supabase = require('./lib/supabase');
const verifyToken = require('./middleware/auth');
const { initScheduler } = require('./utils/scheduler');
const { sendReportEmail, sendTestEmail } = require('./utils/email');
const { validateApifyKey, runUserScrape } = require('./utils/scraper');
const { encryptKey, decryptKey } = require('./utils/crypto');


const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet());

// Restrictive CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',   // Vite Dev
    'http://localhost:5051',   // Express
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5051',
    'https://internai.jaggu.me',
    'https://intern-ai.jaggu.me'
];

if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach(o => allowedOrigins.push(o.trim()));
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked unauthorized origin: ${origin}`);
            callback(new Error('CORS policy violation'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const scrapeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    // Disable strict validation because we are using a custom logic with the helper fallback
    validate: { 
        ip: false,
        xForwardedForHeader: false,
        keyGeneratorIpFallback: false
    },
    keyGenerator: (req, res, options) => {
        // If user is logged in, limit by UID. 
        // Otherwise, use the library's recommended IP key generator for IPv6 safety.
        return req.user?.uid || ipKeyGenerator(req, res, options);
    },
    message: { error: 'Pulse limit reached (10/hr). Please wait for cooldown.' }
});




app.use(express.json());

// Initialize the master scheduler
initScheduler();

// --- Protected User Routes ---

app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', req.user.uid)
            .single();

        if (error || !userData) {
            return res.json({ onboardingRequired: true });
        }

        const data = { ...userData };
        
        // Decrypt key if encrypted before masking
        let rawKey = data.apify_key;
        if (rawKey && rawKey.includes(':')) {
            rawKey = decryptKey(rawKey);
        }

        // Mask the Apify Key for the client
        if (rawKey) {
            data.apifyKey = rawKey.substring(0, 8) + '****************' + rawKey.substring(rawKey.length - 4);
        }

        // Map snake_case DB fields to camelCase for frontend compatibility
        res.json({
            uid: data.uid,
            email: data.email,
            displayName: data.display_name,
            apifyKey: data.apifyKey,
            preferences: data.preferences,
            onboardingRequired: data.onboarding_required,
            isEnabled: data.is_enabled,
            stats: data.stats,
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.post('/api/user/preferences', 
    verifyToken, 
    [
        body('apifyKey').trim().isLength({ min: 10 }).withMessage('Valid Apify API Key required'),
        body('preferences.preferenceSets').isArray({ min: 1 }).withMessage('At least one radar configuration required'),
        body('preferences.resumeText').trim().notEmpty().withMessage('Resume content required for AI matching')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { apifyKey, preferences, onboardingRequired, isEnabled } = req.body;
        
        try {
            // Fetch existing user to check for masked key
            const { data: existingUser } = await supabase
                .from('users')
                .select('apify_key')
                .eq('uid', req.user.uid)
                .single();

            let encryptedKey;
            
            // If the key is masked, keep the existing one as-is
            if (apifyKey && apifyKey.includes('****') && existingUser) {
                encryptedKey = existingUser.apify_key;
            } else if (apifyKey) {
                const isValid = await validateApifyKey(apifyKey);
                if (!isValid) return res.status(400).json({ error: 'Invalid Apify API Key' });
                encryptedKey = encryptKey(apifyKey);
            } else if (existingUser) {
                encryptedKey = existingUser.apify_key;
            }

            const userData = {
                uid: req.user.uid,
                email: req.user.email?.toLowerCase(),
                display_name: req.user.name || '',
                apify_key: encryptedKey,
                preferences,
                onboarding_required: onboardingRequired ?? false,
                is_enabled: isEnabled ?? true,
                updated_at: new Date().toISOString()
            };

            // Upsert: insert if not exists, update if exists
            const { error } = await supabase
                .from('users')
                .upsert(userData, { onConflict: 'uid' });

            if (error) throw error;

            res.json({ message: 'Configuration synchronized successfully' });
        } catch (error) {
            console.error('Update preferences error:', error);
            res.status(500).json({ error: 'Failed to update preferences' });
        }
    }
);

app.get('/api/user/results', verifyToken, async (req, res) => {
    try {
        const { data: results, error } = await supabase
            .from('results')
            .select('*')
            .eq('user_uid', req.user.uid)
            .order('stored_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Map to camelCase for frontend compatibility
        const mapped = (results || []).map(r => ({
            id: r.id,
            title: r.title,
            company: r.company,
            url: r.url,
            source: r.source,
            domain: r.domain,
            description: r.description,
            type: r.type,
            location: r.location,
            matchScore: r.match_score,
            preferenceSetId: r.preference_set_id,
            scrapedAt: r.scraped_at,
            storedAt: r.stored_at
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Results fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

app.delete('/api/user/results', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('results')
            .delete()
            .eq('user_uid', req.user.uid);

        if (error) throw error;
        
        res.json({ message: 'Feed cleared successfully' });
    } catch (error) {
        console.error('Clear feed error:', error);
        res.status(500).json({ error: 'Failed to clear feed' });
    }
});

// Add a job to applied list
app.post('/api/user/applied', verifyToken, async (req, res) => {
    try {
        const { job } = req.body;
        
        const { data: user } = await supabase
            .from('users')
            .select('preferences')
            .eq('uid', req.user.uid)
            .single();

        const currentPrefs = user?.preferences || {};
        const appliedJobs = currentPrefs.appliedJobs || [];
        
        // Prevent duplicates
        if (!appliedJobs.find(j => j.id === job.id)) {
            appliedJobs.unshift({
                ...job,
                appliedAt: new Date().toISOString()
            });
            
            await supabase
                .from('users')
                .update({ preferences: { ...currentPrefs, appliedJobs } })
                .eq('uid', req.user.uid);
        }

        res.json({ message: 'Marked as applied' });
    } catch (error) {
        console.error('Add applied job error:', error);
        res.status(500).json({ error: 'Failed to mark as applied' });
    }
});

// Remove a job from applied list
app.delete('/api/user/applied/:jobId', verifyToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const { data: user } = await supabase
            .from('users')
            .select('preferences')
            .eq('uid', req.user.uid)
            .single();

        const currentPrefs = user?.preferences || {};
        const appliedJobs = (currentPrefs.appliedJobs || []).filter(j => j.id !== jobId);
        
        await supabase
            .from('users')
            .update({ preferences: { ...currentPrefs, appliedJobs } })
            .eq('uid', req.user.uid);

        res.json({ message: 'Removed from applied' });
    } catch (error) {
        console.error('Remove applied job error:', error);
        res.status(500).json({ error: 'Failed to remove applied job' });
    }
});

app.post('/api/user/scrape-now', verifyToken, scrapeLimiter, async (req, res) => {
    console.log(`[ROUTE] Incoming scrape request from user: ${req.user.uid}`);
    try {
        const { data: userData, error: fetchErr } = await supabase
            .from('users')
            .select('*')
            .eq('uid', req.user.uid)
            .single();

        if (fetchErr || !userData || !userData.apify_key) {
            return res.status(400).json({ error: 'System not configured. Please complete onboarding.' });
        }

        const decryptedKey = decryptKey(userData.apify_key);
        
        console.log(`[DEBUG] User Preferences: ${JSON.stringify(userData.preferences, null, 2)}`);
        
        const preferenceSets = userData.preferences?.preferenceSets || [];
        let allResults = [];
        
        if (preferenceSets.length > 0) {
            console.log(`[DEBUG] Processing ${preferenceSets.length} preference sets for manual scrape`);
            for (const set of preferenceSets) {
                console.log(`[DEBUG] Executing scrape for set: ${set.id || set.name} (Force Enabled for manual request)`);
                
                const setResults = await runUserScrape(decryptedKey, {
                    roles: set.roles,
                    locations: set.locations,
                    workTypes: set.workTypes,
                    resumeText: userData.preferences?.resumeText,
                    lookback: set.lookback
                });
                console.log(`[DEBUG] Set ${set.id || set.name} returned ${setResults.length} results`);
                allResults = [...allResults, ...setResults];
            }
        } else {
            console.log('[DEBUG] No preference sets found, falling back to root preferences');
            allResults = await runUserScrape(decryptedKey, userData.preferences || {});
        }

        
        const uniqueResults = Array.from(new Map(allResults.map(item => [item.url, item])).values());

        // Save top 20 results to Supabase
        if (uniqueResults.length > 0) {
            const resultRows = uniqueResults.slice(0, 20).map(result => ({
                user_uid: req.user.uid,
                title: result.title,
                company: result.company,
                url: result.url,
                source: result.source,
                domain: result.domain,
                description: result.description?.substring(0, 500),
                type: result.type,
                location: result.location,
                match_score: result.matchScore || 0,
                scraped_at: result.scrapedAt || new Date().toISOString(),
                stored_at: new Date().toISOString()
            }));

            const { error: insertErr } = await supabase
                .from('results')
                .insert(resultRows);

            if (insertErr) console.error('[DB] Failed to store results:', insertErr.message);
        }

        // Update preference sets lastScrapedAt and stats
        const now = new Date().toISOString();
        const updatedPreferenceSets = preferenceSets.map(set => ({
            ...set,
            lastScrapedAt: now
        }));

        const currentStats = userData.stats || { totalScrapes: 0, totalSent: 0 };

        const { error: updateErr } = await supabase
            .from('users')
            .update({
                preferences: {
                    ...userData.preferences,
                    preferenceSets: updatedPreferenceSets
                },
                stats: {
                    ...currentStats,
                    totalScrapes: (currentStats.totalScrapes || 0) + 1,
                    lastScrape: now
                },
                updated_at: now
            })
            .eq('uid', req.user.uid);

        if (updateErr) console.error('[DB] Failed to update stats:', updateErr.message);

        res.json({ 
            message: 'Pulse search completed', 
            count: uniqueResults.length, 
            results: uniqueResults 
        });

        // Trigger asynchronous email report
        if (uniqueResults.length > 0) {
            console.log(`[MAIL] Dispatching manual report to: ${req.user.email} (${uniqueResults.length} matches)`);
            sendReportEmail(req.user.email, uniqueResults.slice(0, 50), userData.preferences)
                .then(async (emailRes) => {
                    if (emailRes && emailRes.error) {
                        console.error(`[MAIL] Dispatch failed: ${emailRes.error}`);
                    } else {
                        console.log(`[MAIL] Dispatch successful: ${emailRes?.id || 'OK'}`);
                        // Update totalSent
                        const { data: freshUser } = await supabase
                            .from('users')
                            .select('stats')
                            .eq('uid', req.user.uid)
                            .single();
                        
                        if (freshUser) {
                            await supabase
                                .from('users')
                                .update({
                                    stats: {
                                        ...freshUser.stats,
                                        totalSent: (freshUser.stats?.totalSent || 0) + 1
                                    }
                                })
                                .eq('uid', req.user.uid);
                        }
                    }
                })
                .catch(err => console.error('[MAIL] Fatal error during manual report dispatch:', err.message || err));
        }
    } catch (error) {
        console.error('Manual scrape error:', error.message || error);
        res.status(500).json({ error: error.message || 'Manual scrape failed' });
    }
});

app.get('/api/health', (req, res) => res.json({ 
    status: 'active', 
    platform: 'InternAlert 2.0', 
    timestamp: new Date() 
}));

app.listen(PORT, () => {
    console.log(`[InternAlert] SaaS Engine running on port ${PORT}`);
});

const axios = require('axios');

// Ping the server every 6 hours to keep it alive
setInterval(async () => {
    try {
        await axios.get("https://internshipai.onrender.com/health-check");
        console.log('Self-ping successful: Kept server awake');
    } catch (error) {
        console.error('Self-ping failed:', error.message);
    }
}, 21600000);