/**
 * Migration script to add 'size' column to OrderItem table
 * Run with: node src/scripts/add-size-to-orderitem.js
 */

const { sequelize } = require('../config/database');

async function addSizeToOrderItem() {
  try {
    console.log('🔄 Adding size column to OrderItem table...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='OrderItem' AND column_name='size'
    `);
    
    if (results.length > 0) {
      console.log('✅ Size column already exists in OrderItem table.');
      return;
    }
    
    // Add the size column
    await sequelize.query(`
      ALTER TABLE "OrderItem" 
      ADD COLUMN "size" VARCHAR(50) NULL;
    `);
    
    console.log('✅ Successfully added size column to OrderItem table.');
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
addSizeToOrderItem()
  .then(() => {
    console.log('✅ Migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
