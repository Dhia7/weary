const { CSRF_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE } = require('../utils/authCookies');

/** Public mutating auth routes that must work before a CSRF cookie exists. */
const CSRF_EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/resend-verification',
  '/api/auth/2fa/login',
  '/api/auth/logout',
]);

function normalizePath(urlPath) {
  if (!urlPath) return '';
  const withoutQuery = urlPath.split('?')[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  const path = normalizePath(req.originalUrl || req.url);
  if (CSRF_EXEMPT_PATHS.has(path)) {
    return next();
  }

  const accessToken = req.cookies && req.cookies[ACCESS_TOKEN_COOKIE];
  // Guests (no session cookie) skip CSRF; authenticated requests must match
  if (!accessToken) {
    return next();
  }

  const headerToken = req.get('X-CSRF-Token') || req.get('x-csrf-token');
  const cookieToken = req.cookies && req.cookies[CSRF_TOKEN_COOKIE];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
      code: 'CSRF_FAILED',
    });
  }

  return next();
}

module.exports = {
  csrfProtection,
  CSRF_EXEMPT_PATHS,
};
