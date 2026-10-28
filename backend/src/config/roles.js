/**
 * Role and permission definitions for RBAC.
 * `isAdmin` stays true for both admin and super_admin so the admin panel check keeps working.
 */

const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
});

const PERMISSIONS = Object.freeze({
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  COLLECTIONS_WRITE: 'collections:write',
  CATEGORIES_WRITE: 'categories:write',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.CUSTOMER]: [],
  [ROLES.STAFF]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.PRODUCTS_READ,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
});

function resolveUserRole(user) {
  if (!user) return ROLES.CUSTOMER;
  if (user.role) return user.role;
  return user.isAdmin ? ROLES.ADMIN : ROLES.CUSTOMER;
}

function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function getPermissionsForUser(user) {
  return getPermissionsForRole(resolveUserRole(user));
}

function userHasRole(user, ...roles) {
  return roles.includes(resolveUserRole(user));
}

function userHasPermission(user, permission) {
  return getPermissionsForUser(user).includes(permission);
}

function userIsAdmin(user) {
  return userHasRole(user, ROLES.ADMIN, ROLES.SUPER_ADMIN);
}

function userIsSuperAdmin(user) {
  return userHasRole(user, ROLES.SUPER_ADMIN);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  resolveUserRole,
  getPermissionsForRole,
  getPermissionsForUser,
  userHasRole,
  userHasPermission,
  userIsAdmin,
  userIsSuperAdmin,
};
