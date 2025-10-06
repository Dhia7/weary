const { sequelize } = require('./src/config/database');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const ProductCategory = require('./src/models/ProductCategory');

async function testCategoryProducts() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Find accessories category
    const category = await Category.findOne({
      where: { slug: 'accessories' }
    });
    
    if (!category) {
      console.log('Category not found');
      return;
    }
    
    console.log('Found category:', category.name, 'ID:', category.id);
    
    // Test the raw query
    const products = await sequelize.query(`
      SELECT p.*
      FROM "Product" p
      INNER JOIN "ProductCategory" pc ON p.id = pc."productId"
      WHERE pc."categoryId" = :categoryId AND p."isActive" = true
      ORDER BY p."name" ASC
    `, {
      replacements: { categoryId: category.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('Products found:', products.length);
    console.log('Products:', products.map(p => ({ id: p.id, name: p.name })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCategoryProducts();



