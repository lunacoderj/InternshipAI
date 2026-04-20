const crypto = require('crypto');

// API Key encryption (using a 32-character key from env)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '68c7e9f3b2a1d4e5f6a7b8c9d0e1f2a3';

/**
 * Encrypts a string (API Key) before storing in database
 */
function encryptKey(key) {
    if (!key) return null;
    // Don't re-encrypt if it already looks like an IV:Data pair (prevents double encryption)
    if (typeof key === 'string' && key.includes(':') && key.length > 32) {
        return key;
    }
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), iv);
        let encrypted = cipher.update(key, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (e) {
        console.error('Encryption error:', e);
        return key;
    }
}

/**
 * Decrypts a string (API Key) before use
 */
function decryptKey(encrypted) {
    if (!encrypted) return null;
    if (!encrypted.includes(':')) return encrypted; // Already plain text or old format
    
    try {
        const [ivHex, data] = encrypted.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), iv);
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('Decryption error:', e);
        return encrypted;
    }
}

module.exports = { encryptKey, decryptKey };
