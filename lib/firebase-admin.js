const admin = require('firebase-admin');

// Note: In production, you'd use a real JSON file or env var
// For this SaaS build, we assume environment variables are set
// or a serviceAccountKey.json exists in root.

if (!admin.apps.length) {
    try {
        const serviceAccount = require('../serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized via serviceAccountKey.json');
    } catch (error) {
        console.warn('serviceAccountKey.json not found. Attempting to use environment variables.');
        // Fallback to individual env vars if key file is missing
        admin.initializeApp({
            credential: admin.credential.cert({
                project_id: process.env.FIREBASE_PROJECT_ID,
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
        console.log('Firebase Admin initialized via environment variables');
    }
}

module.exports = admin;
