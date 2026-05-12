const { sequelize } = require('../config/database');

/**
 * Adds nullable unique googleId to Users table for Sign in with Google.
 * Safe to run multiple times (idempotent).
 */
async function addGoogleIdToUsers() {
  try {
    const [tableResults] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND lower(table_name) = 'users'
        AND table_type = 'BASE TABLE'
    `);

    if (!tableResults.length) {
      console.log('⚠️  Users table not found; skipping googleId migration.');
      return;
    }

    const usersTable = tableResults[0].table_name;

    const [colResults] = await sequelize.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = 'googleId'
    `,
      { bind: [usersTable] }
    );

    if (colResults.length === 0) {
      await sequelize.query(`
        ALTER TABLE "${usersTable}"
        ADD COLUMN "googleId" VARCHAR(255) NULL
      `);
      console.log('✅ Added googleId column to Users table');
    } else {
      console.log('✅ googleId column already exists on Users table');
    }

    const [idxResults] = await sequelize.query(
      `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = $1
        AND indexname = 'users_google_id_unique'
    `,
      { bind: [usersTable] }
    );

    if (idxResults.length === 0) {
      await sequelize.query(`
        CREATE UNIQUE INDEX users_google_id_unique
        ON "${usersTable}" ("googleId")
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
