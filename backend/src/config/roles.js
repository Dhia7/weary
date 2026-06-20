/**
 * Role and permission definitions for RBAC.
 * `isAdmin` on User is kept in sync with role === 'admin' for backward compatibility.
 */

const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
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
  return userHasRole(user, ROLES.ADMIN);
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
};
