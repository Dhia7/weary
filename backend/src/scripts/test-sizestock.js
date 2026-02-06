const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const { QueryTypes } = require('sequelize');

async function testSizeStock() {
  try {
    console.log('Testing sizeStock column...');
    
    // Test direct SQL query
    const directResult = await sequelize.query(
      'SELECT "id", "name", "sizeStock" FROM "Product" LIMIT 1',
      { type: QueryTypes.SELECT }
    );
    console.log('✓ Direct SQL query works:', directResult);
    
    // Test Sequelize query
    const sequelizeResult = await Product.findOne({
      attributes: ['id', 'name', 'sizeStock'],
      raw: true
    });
    console.log('✓ Sequelize query works:', sequelizeResult);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testSizeStock();
