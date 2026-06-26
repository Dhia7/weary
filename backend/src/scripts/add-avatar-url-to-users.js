const { sequelize, resolveTableName, addColumnIfMissing } = require('./migration-utils');

/**
 * Adds nullable avatarUrl to the User table for profile photos.
 * Safe to run multiple times (idempotent).
 */
async function addAvatarUrlToUsers() {
  const tableName = await resolveTableName(['User', 'Users']);
  if (!tableName) {
    console.warn('User table not found — skipping avatarUrl migration');
    return;
  }

  await addColumnIfMissing(tableName, 'avatarUrl', 'VARCHAR(2048) NULL', 'Profile avatar image URL');
}

module.exports = addAvatarUrlToUsers;
