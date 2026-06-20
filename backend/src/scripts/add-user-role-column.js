/**
 * Adds role column to User and backfills from isAdmin.
 */

const { sequelize } = require('../config/database');

async function addUserRoleColumn() {
  const [enumExists] = await sequelize.query(`
    SELECT 1 FROM pg_type WHERE typname = 'enum_User_role'
  `);

  if (!enumExists.length) {
    await sequelize.query(`
      CREATE TYPE "enum_User_role" AS ENUM ('customer', 'staff', 'admin')
    `);
  }

  const [columnExists] = await sequelize.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'role'
  `);

  if (!columnExists.length) {
    await sequelize.query(`
      ALTER TABLE "User"
      ADD COLUMN "role" "enum_User_role" NOT NULL DEFAULT 'customer'
    `);
  }

  await sequelize.query(`
    UPDATE "User"
    SET "role" = 'admin'
    WHERE "isAdmin" = true AND "role" != 'admin'
  `);

  await sequelize.query(`
    UPDATE "User"
    SET "role" = 'customer'
    WHERE "isAdmin" = false AND "role" = 'admin'
  `);
}

module.exports = { addUserRoleColumn };
