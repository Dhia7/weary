const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function verifySizeStock() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Check if column exists
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'sizeStock'
    `, { type: QueryTypes.SELECT });
    
    if (cols && cols.length > 0) {
      console.log('✅ sizeStock column EXISTS');
      console.log('Column details:', cols);
    } else {
      console.log('❌ sizeStock column does NOT exist');
    }
    
    // Try direct query
    try {
      const [test] = await sequelize.query(
        'SELECT id, name, "sizeStock" FROM "Product" LIMIT 1',
        { type: QueryTypes.SELECT }
      );
      console.log('✅ Direct SQL query works:', test);
    } catch (queryError) {
      console.log('❌ Direct SQL query failed:', queryError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifySizeStock();
