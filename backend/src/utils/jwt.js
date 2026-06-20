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

module.exports = {
  getJwtSecret,
  assertJwtConfigured,
  signAccessToken,
  verifyAccessToken,
};
