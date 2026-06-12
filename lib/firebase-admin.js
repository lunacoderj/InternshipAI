const admin = require('firebase-admin');

// Firebase Admin is now used ONLY for verifying ID tokens (auth).
// All database operations have been migrated to Supabase.

if (!admin.apps.length) {
    try {
        const serviceAccount = require('../serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized via serviceAccountKey.json (Auth only)');
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
        console.log('Firebase Admin initialized via environment variables (Auth only)');
    }
}

module.exports = admin;
