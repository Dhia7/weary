const jwt = require('jsonwebtoken');

const DEFAULT_DEV_SECRET =
  'your_jwt_secret_key_here_make_it_long_and_secure_for_development_only';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32 || secret === DEFAULT_DEV_SECRET) {
      throw new Error(
        'JWT_SECRET must be set to a strong value (32+ characters) in production'
      );
    }
    return secret;
  }

  return secret || DEFAULT_DEV_SECRET;
}

function assertJwtConfigured() {
  getJwtSecret();
}

function signAccessToken(userId) {
  const expiresIn =
    process.env.JWT_EXPIRES_IN ||
    (process.env.NODE_ENV === 'production' ? '24h' : '7d');

  return jwt.sign({ userId }, getJwtSecret(), { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

/** Short-lived token to complete 2FA after Google sign-in. */
function signTwoFactorPendingToken(userId) {
  return jwt.sign(
    { userId, purpose: '2fa_pending' },
    getJwtSecret(),
    { expiresIn: '5m' }
  );
}

function verifyTwoFactorPendingToken(token) {
  const decoded = jwt.verify(token, getJwtSecret());
  if (decoded.purpose !== '2fa_pending' || !decoded.userId) {
    throw new Error('Invalid two-factor pending token');
  }
  return decoded;
}

module.exports = {
  getJwtSecret,
  assertJwtConfigured,
  signAccessToken,
  verifyAccessToken,
  signTwoFactorPendingToken,
  verifyTwoFactorPendingToken,
};
