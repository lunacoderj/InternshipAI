require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const { body, validationResult } = require('express-validator');
const admin = require('./lib/firebase-admin');
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
        const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            return res.json({ onboardingRequired: true });
        }
        const data = userDoc.data();
        
        // Decrypt key if encrypted before masking
        let rawKey = data.apifyKey;
        if (rawKey && rawKey.includes(':')) {
            rawKey = decryptKey(rawKey);
        }

        // Mask the Apify Key for the client
        if (rawKey) {
            data.apifyKey = rawKey.substring(0, 8) + '****************' + rawKey.substring(rawKey.length - 4);
        }
        
        res.json(data);

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
            const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
            let encryptedKey;
            
            // If the key is masked, keep the existing one as-is
            if (apifyKey && apifyKey.includes('****') && userDoc.exists) {
                encryptedKey = userDoc.data().apifyKey;
            } else if (apifyKey) {
                const isValid = await validateApifyKey(apifyKey);
                if (!isValid) return res.status(400).json({ error: 'Invalid Apify API Key' });
                encryptedKey = encryptKey(apifyKey);
            } else if (userDoc.exists) {
                encryptedKey = userDoc.data().apifyKey;
            }

            const userData = {
                uid: req.user.uid,
                email: req.user.email?.toLowerCase(),
                displayName: req.user.name || '',
                apifyKey: encryptedKey,
                preferences,
                onboardingRequired: onboardingRequired ?? false,
                isEnabled: isEnabled ?? true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await admin.firestore().collection('users').doc(req.user.uid).set(userData, { merge: true });

            
            // Send connection confirmation email if this is the first time or if requested
            // await sendTestEmail(req.user.email);

            res.json({ message: 'Configuration synchronized successfully' });
        } catch (error) {
            console.error('Update preferences error:', error);
            res.status(500).json({ error: 'Failed to update preferences' });
        }
    }
);

app.get('/api/user/results', verifyToken, async (req, res) => {
    try {
        const resultsSnapshot = await admin.firestore()
            .collection('users')
            .doc(req.user.uid)
            .collection('results')
            .orderBy('storedAt', 'desc')
            .limit(50)
            .get();

        const results = resultsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(results);
    } catch (error) {
        console.error('Results fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

app.post('/api/user/scrape-now', verifyToken, scrapeLimiter, async (req, res) => {
    console.log(`[ROUTE] Incoming scrape request from user: ${req.user.uid}`);
    try {
        const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
        if (!userDoc.exists || !userDoc.data().apifyKey) {
            return res.status(400).json({ error: 'System not configured. Please complete onboarding.' });
        }

        const userData = userDoc.data();
        const decryptedKey = decryptKey(userData.apifyKey);
        
        console.log(`[DEBUG] User Preferences: ${JSON.stringify(userData.preferences, null, 2)}`);
        
        const preferenceSets = userData.preferences?.preferenceSets || [];
        let allResults = [];
        
        if (preferenceSets.length > 0) {
            console.log(`[DEBUG] Processing ${preferenceSets.length} preference sets for manual scrape`);
            for (const set of preferenceSets) {
                // For manual "Scrape Now", we ignore the 'enabled' flag 
                // because the user explicitly requested an immediate scan.
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

        // Update stats
        const userRef = admin.firestore().collection('users').doc(req.user.uid);
        await userRef.update({
            'stats.totalScrapes': admin.firestore.FieldValue.increment(1),
            'stats.lastScrape': admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ 
            message: 'Pulse search completed', 
            count: uniqueResults.length, 
            results: uniqueResults 
        });

        // Trigger asynchronous email report
        if (uniqueResults.length > 0) {
            console.log(`[MAIL] Dispatching manual report to: ${req.user.email} (${uniqueResults.length} matches)`);
            sendReportEmail(req.user.email, uniqueResults.slice(0, 50), userData.preferences)
                .then(async (res) => {
                    if (res && res.error) {
                        console.error(`[MAIL] Dispatch failed: ${res.error}`);
                    } else {
                        console.log(`[MAIL] Dispatch successful: ${res?.id || 'OK'}`);
                        await userRef.update({
                            'stats.totalSent': admin.firestore.FieldValue.increment(1)
                        });
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
