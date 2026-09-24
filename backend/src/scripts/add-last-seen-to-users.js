const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

async function addLastSeenToUsers() {
  const tableName = await resolveTableName(['User', 'Users']);
  if (!tableName) {
    console.warn('User table not found — skipping lastSeenAt migration');
    return;
  }

  await addColumnIfMissing(tableName, 'lastSeenAt', 'TIMESTAMPTZ NULL', 'Last time this account sent a presence heartbeat');
}

module.exports = addLastSeenToUsers;
