require('dotenv').config();
const { sequelize } = require('../config/database');

async function checkColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Check OrderItem table columns
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name='OrderItem'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 OrderItem table columns:');
    console.log(JSON.stringify(results, null, 2));
    
    // Check if size column exists
    const hasSize = results.some(col => col.column_name === 'size');
    console.log(`\n${hasSize ? '✅' : '❌'} Size column exists: ${hasSize}`);
    
    if (!hasSize) {
      console.log('\n🔄 Adding size column...');
      await sequelize.query(`
        ALTER TABLE "OrderItem" 
        ADD COLUMN "size" VARCHAR(50) NULL;
      `);
      console.log('✅ Size column added successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

checkColumns();
