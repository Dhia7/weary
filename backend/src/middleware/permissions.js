const { userHasPermission, userHasRole, ROLES } = require('../config/roles');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.userData) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (!userHasRole(req.userData, ...roles)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient role for this action',
    });
  }

  return next();
};

const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.userData) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const allowed = permissions.every((permission) =>
    userHasPermission(req.userData, permission)
  );

  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions for this action',
    });
  }

  return next();
};

const requireAdmin = requireRole(ROLES.ADMIN);

module.exports = {
  requireRole,
  requirePermission,
  requireAdmin,
};
