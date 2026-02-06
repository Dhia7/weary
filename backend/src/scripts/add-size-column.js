/**
 * Migration script to add 'size' column to Product table
 * Run with: node src/scripts/add-size-column.js
 */

const { sequelize } = require('../config/database');

async function addSizeColumn() {
  try {
    console.log('🔄 Adding size column to Product table...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='Product' AND column_name='size'
    `);
    
    if (results.length > 0) {
      console.log('✅ Size column already exists in Product table.');
      return;
    }
    
    // Add the size column
    await sequelize.query(`
      ALTER TABLE "Product" 
      ADD COLUMN "size" VARCHAR(50) NULL;
    `);
    
    console.log('✅ Successfully added size column to Product table.');
    console.log('   Column: size (VARCHAR(50), nullable)');
    
  } catch (error) {
    console.error('❌ Error adding size column:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addSizeColumn()
  .then(() => {
    console.log('✅ Migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
