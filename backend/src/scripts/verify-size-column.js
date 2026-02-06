/**
 * Verification script to check if size column exists
 * Run with: node src/scripts/verify-size-column.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

async function verifySizeColumn() {
  try {
    console.log('🔍 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully.');
    
    // Get database name
    const [dbInfo] = await sequelize.query('SELECT current_database() as db_name');
    console.log('📊 Database:', dbInfo[0].db_name);
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name='Product' AND column_name='size'
    `);
    
    if (results.length > 0) {
      console.log('✅ Size column EXISTS in Product table.');
      console.log('   Details:', results[0]);
    } else {
      console.log('❌ Size column does NOT exist in Product table.');
      console.log('   Running migration...');
      
      // Add the size column
      await sequelize.query(`
        ALTER TABLE "Product" 
        ADD COLUMN "size" VARCHAR(50) NULL;
      `);
      
      console.log('✅ Successfully added size column to Product table.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the verification
verifySizeColumn()
  .then(() => {
    console.log('✅ Verification completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
