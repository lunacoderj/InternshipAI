const cron = require('node-cron');
const admin = require('firebase-admin');
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
        const db = admin.firestore();

        try {
            const usersSnapshot = await db.collection('users')
                .where('isEnabled', '==', true)
                .get();

            if (usersSnapshot.empty) {
                console.log('No users with automation enabled.');
                return;
            }

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const userId = userDoc.id;
                const preferenceSets = userData.preferences?.preferenceSets || [];

                if (preferenceSets.length === 0) continue;

                let userUpdated = false;
                const updatedPreferenceSets = [...preferenceSets];

                for (let i = 0; i < updatedPreferenceSets.length; i++) {
                    const set = updatedPreferenceSets[i];
                    if (!set.enabled) continue;

                    // Robust timestamp conversion (Fix Issue #5)
                    let lastScrapedAt = 0;
                    if (set.lastScrapedAt) {
                        if (typeof set.lastScrapedAt === 'number') {
                            lastScrapedAt = set.lastScrapedAt;
                        } else if (typeof set.lastScrapedAt === 'string') {
                            lastScrapedAt = new Date(set.lastScrapedAt).getTime();
                        } else if (set.lastScrapedAt.toMillis) {
                            lastScrapedAt = set.lastScrapedAt.toMillis();
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
                            const decryptedKey = decryptKey(userData.apifyKey);

                            // 1. Run scrape for this specific set
                            const results = await runUserScrape(decryptedKey, {
                                roles: set.roles,
                                locations: set.locations,
                                workTypes: set.workTypes,
                                resumeText: userData.preferences?.resumeText,
                                lookback: set.lookback
                            });

                            
                            // 2. Send email for this specific set
                            await sendReportEmail(userData.notificationEmail || userData.email, results, {
                                roles: set.roles,
                                location: set.locations,
                                workTypes: set.workTypes
                            });
                            
                            // 3. Update set stats
                            updatedPreferenceSets[i] = {
                                ...set,
                                lastScrapedAt: admin.firestore.FieldValue.serverTimestamp(),
                                totalScrapes: (set.totalScrapes || 0) + 1
                            };
                            userUpdated = true;

                            console.log(`Successfully completed scrape for ${userData.email} - Set ${set.id}`);
                        } catch (err) {
                            console.error(`Automation failed for ${userData.email} - Set ${set.id}:`, err.message);
                        }
                    }
                }

                if (userUpdated) {
                    await userDoc.ref.update({
                        'preferences.preferenceSets': updatedPreferenceSets,
                        'stats.totalScrapes': admin.firestore.FieldValue.increment(1),
                        'stats.lastScrape': admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        } catch (error) {
            console.error('Master scheduler error:', error);
        }
        console.log('--- Master Scheduler Run End ---');
    });
}

module.exports = { initScheduler };
