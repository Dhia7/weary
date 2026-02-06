/**
 * Migration script to add sizeStock column to Product table
 * Run with: node src/scripts/add-sizestock-column.js
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addSizeStockColumn() {
  try {
    console.log('Starting migration: Adding sizeStock column to Product table...');
    
    // Check if column already exists (PostgreSQL uses lowercase for unquoted identifiers)
    // Check both quoted and unquoted versions
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      AND (column_name = 'sizeStock' OR column_name = 'sizestock')
    `, { type: QueryTypes.SELECT });
    
    console.log('Checking for existing column...', results);
    
    if (results && results.length > 0) {
      console.log('✓ Column sizeStock already exists. Skipping migration.');
      await sequelize.close();
      return;
    }
    
    // Add the sizeStock column
    await sequelize.query(`
      ALTER TABLE "Product" 
      ADD COLUMN "sizeStock" JSONB DEFAULT '{}'::jsonb
    `, { type: QueryTypes.RAW });
    
    console.log('✓ Successfully added sizeStock column to Product table');
    
    // Add comment to the column
    await sequelize.query(`
      COMMENT ON COLUMN "Product"."sizeStock" IS 'Stock quantity per size (e.g., {"S": 10, "M": 5, "L": 8})'
    `, { type: QueryTypes.RAW });
    
    console.log('✓ Added comment to sizeStock column');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addSizeStockColumn()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
