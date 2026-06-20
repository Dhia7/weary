const speakeasy = require('speakeasy');

function generateTwoFactorSecret(email) {
  return speakeasy.generateSecret({
    name: `Wear (${email})`,
    length: 32,
  });
}

function verifyTotpCode(secret, code) {
  if (!secret || !code) return false;

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(code).trim(),
    window: 1,
  });
}

module.exports = {
  generateTwoFactorSecret,
  verifyTotpCode,
};
