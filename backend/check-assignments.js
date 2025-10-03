const { sequelize } = require('./src/config/database');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const ProductCategory = require('./src/models/ProductCategory');

async function checkAssignments() {
  try {
    await sequelize.authenticate();
    console.log('=== CATEGORIES ===');
    const categories = await Category.findAll();
    categories.forEach(cat => console.log(`ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`));
    
    console.log('\n=== PRODUCTS ===');
    const products = await Product.findAll();
    products.forEach(prod => console.log(`ID: ${prod.id}, Name: ${prod.name}`));
    
    console.log('\n=== PRODUCT-CATEGORY RELATIONSHIPS ===');
    const relationships = await ProductCategory.findAll();
    relationships.forEach(rel => console.log(`Product ${rel.productId} -> Category ${rel.categoryId}`));
    
    // Check what products are in each category
    console.log('\n=== PRODUCTS BY CATEGORY ===');
    for (const category of categories) {
      const categoryProducts = await sequelize.query(`
        SELECT p.id, p.name 
        FROM "Product" p
        INNER JOIN "ProductCategory" pc ON p.id = pc."productId"
        WHERE pc."categoryId" = :categoryId
      `, {
        replacements: { categoryId: category.id },
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log(`\n${category.name} (${category.slug}):`);
      categoryProducts.forEach(prod => console.log(`  - ${prod.name}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAssignments();


