const bcrypt = require('bcryptjs');

/**
 * Generates a random 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes an OTP for secure storage in Firestore
 */
async function hashOTP(otp) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
}

/**
 * Compares a plain OTP with a hash
 */
async function verifyOTPHash(otp, hash) {
    return await bcrypt.compare(otp, hash);
}

module.exports = {
    generateOTP,
    hashOTP,
    verifyOTPHash
};
