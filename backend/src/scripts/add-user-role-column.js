/**
 * Adds role column to User, backfills from isAdmin, and ensures one super admin.
 */

const { sequelize } = require('../config/database');

async function roleEnumTypeName() {
  const [rows] = await sequelize.query(`
    SELECT t.typname
    FROM pg_type t
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'User' AND a.attname = 'role' AND t.typtype = 'e'
    LIMIT 1
  `);
  return rows[0]?.typname || 'enum_User_role';
}

async function ensureSuperAdminValue(typeName) {
  const [labels] = await sequelize.query(`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = :typeName AND e.enumlabel = 'super_admin'
  `, { replacements: { typeName } });

  if (!labels.length) {
    await sequelize.query(`ALTER TYPE "${typeName}" ADD VALUE 'super_admin'`);
  }
}

async function addUserRoleColumn() {
  const [enumExists] = await sequelize.query(`
    SELECT 1 FROM pg_type WHERE typname = 'enum_User_role'
  `);

  if (!enumExists.length) {
    await sequelize.query(`
      CREATE TYPE "enum_User_role" AS ENUM ('customer', 'staff', 'admin', 'super_admin')
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

  await ensureSuperAdminValue(await roleEnumTypeName());

  await sequelize.query(`
    UPDATE "User"
    SET "role" = 'admin'
    WHERE "isAdmin" = true AND "role" NOT IN ('admin', 'super_admin')
  `);

  await sequelize.query(`
    UPDATE "User"
    SET "role" = 'customer'
    WHERE "isAdmin" = false AND "role" = 'admin'
  `);

  const ownerEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (ownerEmail) {
    await sequelize.query(`
      UPDATE "User"
      SET "role" = 'super_admin', "isAdmin" = true
      WHERE lower(email) = :ownerEmail
    `, { replacements: { ownerEmail } });
  }

  const [superAdmins] = await sequelize.query(`
    SELECT 1 FROM "User" WHERE "role" = 'super_admin' LIMIT 1
  `);
  if (!superAdmins.length) {
    await sequelize.query(`
      UPDATE "User"
      SET "role" = 'super_admin', "isAdmin" = true
      WHERE id = (
        SELECT id FROM "User"
        WHERE "role" = 'admin' OR "isAdmin" = true
        ORDER BY "createdAt" ASC
        LIMIT 1
      )
    `);
  }
}

module.exports = { addUserRoleColumn };
