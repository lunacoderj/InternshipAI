const { encryptKey, decryptKey } = require('../utils/crypto');

// Set dummy env
process.env.ENCRYPTION_KEY = '48a1d5dec15ac784c3b989d44fdbab4690778fd1';

const testKey = 'apify_api_1234567890abcdef';
console.log('Original Key:', testKey);

const encryptedOnce = encryptKey(testKey);
console.log('Encrypted Once:', encryptedOnce);

const encryptedTwice = encryptKey(encryptedOnce);
console.log('Encrypted Twice (Should be same as Once):', encryptedTwice);

const decrypted = decryptKey(encryptedTwice);
console.log('Decrypted:', decrypted);

if (testKey === decrypted) {
    console.log('SUCCESS: Cryptography is stable and idempotent.');
} else {
    console.log('FAILURE: Cryptography mismatch.');
}
