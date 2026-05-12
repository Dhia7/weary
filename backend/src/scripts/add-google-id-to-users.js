const { sequelize } = require('../config/database');
const User = require('../models/User');

/**
 * Adds nullable unique googleId to the User model's table for Sign in with Google.
 * Safe to run multiple times (idempotent).
 */
async function addGoogleIdToUsers() {
  try {
    const usersTable = User.tableName;
    const qi = sequelize.getQueryInterface();
    const quotedTable = qi.quoteIdentifier(usersTable);

    const [colResults] = await sequelize.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = :tableName
        AND column_name = 'googleId'
    `,
      { replacements: { tableName: usersTable } }
    );

    if (colResults.length === 0) {
      await sequelize.query(`
        ALTER TABLE ${quotedTable}
        ADD COLUMN "googleId" VARCHAR(255) NULL
      `);
      console.log(`✅ Added googleId column to table ${quotedTable}`);
    } else {
      console.log('✅ googleId column already exists on User table');
    }

    const [idxResults] = await sequelize.query(
      `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = :tableName
        AND indexname = 'users_google_id_unique'
    `,
      { replacements: { tableName: usersTable } }
    );

    if (idxResults.length === 0) {
      await sequelize.query(`
        CREATE UNIQUE INDEX users_google_id_unique
        ON ${quotedTable} ("googleId")
        WHERE "googleId" IS NOT NULL
      `);
      console.log('✅ Created partial unique index on googleId');
    } else {
      console.log('✅ googleId unique index already exists');
    }
  } catch (err) {
    console.warn('googleId migration:', err.message);
  }
}

module.exports = addGoogleIdToUsers;
