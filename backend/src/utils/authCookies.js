const crypto = require('crypto');

const ACCESS_TOKEN_COOKIE = 'access_token';
const CSRF_TOKEN_COOKIE = 'csrf_token';

function parseExpiresInToMs(expiresIn) {
  if (!expiresIn) {
    return process.env.NODE_ENV === 'production'
      ? 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;
  }
  if (typeof expiresIn === 'number') return expiresIn * 1000;
  const match = String(expiresIn).match(/^(\d+)([smhd])$/i);
  if (!match) return 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (mult[unit] || 3_600_000);
}

function cookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    path: '/',
    sameSite: 'lax',
    secure: isProd,
    // No Domain — binds to the request host (frontend via Next rewrite)
  };
}

function getAccessTokenMaxAgeMs() {
  return parseExpiresInToMs(
    process.env.JWT_EXPIRES_IN ||
      (process.env.NODE_ENV === 'production' ? '24h' : '7d')
  );
}

function setAuthCookies(res, accessToken) {
  const maxAge = getAccessTokenMaxAgeMs();
  const base = cookieBaseOptions();
  const csrfToken = crypto.randomBytes(32).toString('hex');

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...base,
    httpOnly: true,
    maxAge,
  });

  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, {
    ...base,
    httpOnly: false,
    maxAge,
  });

  return csrfToken;
}

function clearAuthCookies(res) {
  const base = cookieBaseOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...base, httpOnly: true });
  res.clearCookie(CSRF_TOKEN_COOKIE, { ...base, httpOnly: false });
}

function getAccessTokenFromRequest(req) {
  if (req.cookies && req.cookies[ACCESS_TOKEN_COOKIE]) {
    return req.cookies[ACCESS_TOKEN_COOKIE];
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

module.exports = {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromRequest,
  getAccessTokenMaxAgeMs,
};
