const cron = require('node-cron');
const supabase = require('../lib/supabase');
const { runUserScrape } = require('./scraper');
const { sendReportEmail } = require('./email');
const { decryptKey } = require('./crypto');


/**
 * Initializes the master scheduler
 * Runs every 30 minutes
 */
function initScheduler() {
    console.log('Initializing multi-preference scheduler (30m interval)...');
    
    cron.schedule('*/30 * * * *', async () => {
        console.log('--- Master Scheduler Run Start ---');
        const now = Date.now();

        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('is_enabled', true);

            if (error) {
                console.error('Scheduler DB error:', error.message);
                return;
            }

            if (!users || users.length === 0) {
                console.log('No users with automation enabled.');
                return;
            }

            for (const userData of users) {
                const userId = userData.uid;
                const preferenceSets = userData.preferences?.preferenceSets || [];

                if (preferenceSets.length === 0) continue;

                let userUpdated = false;
                const updatedPreferenceSets = [...preferenceSets];

                for (let i = 0; i < updatedPreferenceSets.length; i++) {
                    const set = updatedPreferenceSets[i];
                    if (!set.enabled) continue;

                    // Robust timestamp conversion
                    let lastScrapedAt = 0;
                    if (set.lastScrapedAt) {
                        if (typeof set.lastScrapedAt === 'number') {
                            lastScrapedAt = set.lastScrapedAt;
                        } else if (typeof set.lastScrapedAt === 'string') {
                            lastScrapedAt = new Date(set.lastScrapedAt).getTime();
                        } else if (set.lastScrapedAt._seconds) {
                            lastScrapedAt = set.lastScrapedAt._seconds * 1000;
                        }
                    }
                    
                    const intervalHours = parseInt(set.interval) || 24; 
                    const intervalMs = intervalHours * 60 * 60 * 1000;

                    if (now - lastScrapedAt >= intervalMs) {
                        console.log(`[Scheduler] User ${userData.email} - Set ${set.id} is due. (Interval: ${intervalHours}h)`);
                        
                        try {
                            // Decrypt key for background run
                            const decryptedKey = decryptKey(userData.apify_key);

                            // 1. Run scrape for this specific set
                            const results = await runUserScrape(decryptedKey, {
                                roles: set.roles,
                                locations: set.locations,
                                workTypes: set.workTypes,
                                resumeText: userData.preferences?.resumeText,
                                lookback: set.lookback
                            });

                            if (results.length > 0) {
                                // 2. Send email for this specific set
                                await sendReportEmail(userData.notificationEmail || userData.email, results, {
                                    roles: set.roles,
                                    location: set.locations,
                                    workTypes: set.workTypes
                                });

                                // 3. Store results in Supabase
                                const resultRows = results.slice(0, 20).map(result => ({
                                    user_uid: userId,
                                    title: result.title,
                                    company: result.company,
                                    url: result.url,
                                    source: result.source,
                                    domain: result.domain,
                                    description: result.description?.substring(0, 500),
                                    type: result.type,
                                    location: result.location,
                                    match_score: result.matchScore || 0,
                                    preference_set_id: set.id,
                                    scraped_at: result.scrapedAt || new Date().toISOString(),
                                    stored_at: new Date().toISOString()
                                }));

                                const { error: insertErr } = await supabase
                                    .from('results')
                                    .insert(resultRows);

                                if (insertErr) console.error('[Scheduler] Failed to store results:', insertErr.message);
                            }
                            
                            // 4. Update set stats
                            updatedPreferenceSets[i] = {
                                ...set,
                                lastScrapedAt: new Date().toISOString(),
                                totalScrapes: (set.totalScrapes || 0) + 1
                            };
                            userUpdated = true;

                            console.log(`Successfully completed scrape for ${userData.email} - Set ${set.id}. Found ${results.length} matches.`);
                        } catch (err) {
                            console.error(`Automation failed for ${userData.email} - Set ${set.id}:`, err.message);
                        }
                    }
                }

                if (userUpdated) {
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
                                lastScrape: new Date().toISOString()
                            },
                            updated_at: new Date().toISOString()
                        })
                        .eq('uid', userId);

                    if (updateErr) console.error(`[Scheduler] Failed to update user ${userData.email}:`, updateErr.message);
                }
            }
        } catch (error) {
            console.error('Master scheduler error:', error);
        }
        console.log('--- Master Scheduler Run End ---');
    });
}

module.exports = { initScheduler };

