const { sequelize } = require('../config/database');
const User = require('../models/User');

/**
 * Adds hasLocalPassword to User. Existing Google accounts are marked false
 * once, when the column is created, so a later password reset is kept.
 */
async function addHasLocalPassword() {
  const usersTable = User.tableName;
  const qi = sequelize.getQueryInterface();
  const quotedTable = qi.quoteIdentifier(usersTable);

  const [colResults] = await sequelize.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = :tableName
      AND column_name = 'hasLocalPassword'
  `,
    { replacements: { tableName: usersTable } }
  );

  if (colResults.length > 0) {
    console.log('✅ hasLocalPassword column already exists on User table');
    return;
  }

  await sequelize.query(`
    ALTER TABLE ${quotedTable}
    ADD COLUMN "hasLocalPassword" BOOLEAN NOT NULL DEFAULT true
  `);

  await sequelize.query(`
    UPDATE ${quotedTable}
    SET "hasLocalPassword" = false
    WHERE "googleId" IS NOT NULL
  `);

  console.log('✅ Added hasLocalPassword and marked existing Google accounts');
}

module.exports = addHasLocalPassword;
