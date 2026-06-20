const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';
const isEnabled =
  isProduction || process.env.ENABLE_RATE_LIMIT === 'true';

const skipOptions = (req) => req.method === 'OPTIONS';

const rateLimitMessage = (message) => ({
  success: false,
  message,
});

let sharedStore;
let storeInitAttempted = false;

function getStore() {
  if (storeInitAttempted) {
    return sharedStore;
  }
  storeInitAttempted = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return undefined;
  }

  try {
    const { RedisStore } = require('rate-limit-redis');
    const { createClient } = require('redis');

    const client = createClient({ url: redisUrl });
    client.on('error', (err) => {
      console.error('Redis rate-limit client error:', err.message || err);
    });
    client.connect().catch((err) => {
      console.error('Redis rate-limit connect failed:', err.message || err);
    });

    sharedStore = new RedisStore({
      sendCommand: (...args) => client.sendCommand(args),
      prefix: 'wear:rl:',
    });
    console.log('Rate limiting: using Redis store');
  } catch (err) {
    console.warn(
      'Rate limiting: Redis store unavailable, using in-memory store:',
      err.message || err
    );
    sharedStore = undefined;
  }

  return sharedStore;
}

function createLimiter(options) {
  if (!isEnabled) {
    return (req, res, next) => next();
  }

  const store = getStore();
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipOptions,
    ...(store ? { store } : {}),
    ...options,
  });
}

/** General API traffic — raised from 100 to avoid throttling normal browsing */
const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 1000,
  message: rateLimitMessage(
    'Too many requests from this IP, please try again later.'
  ),
});

/** Login, register, Google sign-in */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  message: rateLimitMessage(
    'Too many authentication attempts. Please try again later.'
  ),
});

/** Forgot password, resend verification — prevents email abuse */
const emailLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 3 : 20,
  message: rateLimitMessage(
    'Too many email requests. Please try again in an hour.'
  ),
});

/** Password reset token submission */
const resetPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 30,
  message: rateLimitMessage(
    'Too many password reset attempts. Please try again later.'
  ),
});

/** External translation API */
const translateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 30 : 100,
  message: rateLimitMessage(
    'Translation limit reached. Please try again later.'
  ),
});

/** Guest checkout and personalized t-shirt orders */
const checkoutLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 10 : 50,
  message: rateLimitMessage(
    'Too many checkout attempts. Please try again later.'
  ),
});

/** Authenticated write operations (cart, wishlist) — keyed by user when available */
const authenticatedWriteLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 120 : 500,
  keyGenerator: (req) => {
    const userId = req.user?.userId;
    return userId ? `user:${userId}` : req.ip;
  },
  skip: (req) =>
    skipOptions(req) || req.method === 'GET' || req.method === 'HEAD',
  message: rateLimitMessage(
    'Too many requests. Please slow down and try again.'
  ),
});

module.exports = {
  isRateLimitEnabled: () => isEnabled,
  globalLimiter,
  authLimiter,
  emailLimiter,
  resetPasswordLimiter,
  translateLimiter,
  checkoutLimiter,
  authenticatedWriteLimiter,
};
