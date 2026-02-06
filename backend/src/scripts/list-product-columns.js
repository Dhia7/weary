const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function listColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // List all columns
    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Product'
      ORDER BY ordinal_position
    `, { type: QueryTypes.SELECT });
    
    console.log('\n📊 All Product table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check specifically for sizeStock (case-insensitive)
    const sizeStockCol = columns.find(c => 
      c.column_name.toLowerCase() === 'sizestock' || 
      c.column_name === 'sizeStock'
    );
    
    if (sizeStockCol) {
      console.log('\n✅ Found sizeStock column:', sizeStockCol);
    } else {
      console.log('\n❌ sizeStock column not found in list');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

listColumns();
