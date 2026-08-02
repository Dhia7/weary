const User = require('../models/User');
const { withTimeout, TIMEOUTS } = require('../utils/queryTimeout');
const { verifyAccessToken } = require('../utils/jwt');
const { getAccessTokenFromRequest } = require('../utils/authCookies');
const { userIsAdmin } = require('../config/roles');

async function loadUserFromToken(token) {
  const decoded = verifyAccessToken(token);
  const user = await withTimeout(
    User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    }),
    TIMEOUTS.AUTH,
    'User authentication query'
  );
  return { decoded, user };
}

// Protect routes - require authentication (cookie first, Bearer fallback)
const protect = async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

  try {
    const { decoded, user } = await loadUserFromToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    req.user = decoded;
    req.userData = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);

    if (error.message && error.message.includes('timeout')) {
      console.error('Database query timeout during token verification');
      return res.status(408).json({
        success: false,
        message: 'Authentication timeout - please try again',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

// Optional auth - doesn't require authentication but adds user if available
const optionalAuth = async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    return next();
  }

  try {
    const { decoded, user } = await loadUserFromToken(token);
    if (user && user.isActive) {
      req.user = decoded;
      req.userData = user;
    }
  } catch (error) {
    console.log('Optional auth failed:', error.message);
  }

  next();
};

// Admin middleware
const admin = async (req, res, next) => {
  try {
    if (!req.userData) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!userIsAdmin(req.userData)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as admin',
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  protect,
  optionalAuth,
  admin,
  ...require('./permissions'),
};
