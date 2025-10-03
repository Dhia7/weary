const { sequelize } = require('./src/config/database');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const ProductCategory = require('./src/models/ProductCategory');

async function testProductCreation() {
  try {
    await sequelize.authenticate();
    console.log('Testing product creation with categories...');
    
    // Create a test product
    const testProduct = await Product.create({
      name: 'Test Jewelry Product 2',
      slug: `test-jewelry-product-${Date.now()}`,
      description: 'A test jewelry product',
      price: 99.99,
      SKU: `TEST-JEWELRY-${Date.now()}`,
      quantity: 10,
      isActive: true
    });
    
    console.log('Created test product:', testProduct.name, 'ID:', testProduct.id);
    
    // Get jewelry category
    const jewelryCategory = await Category.findOne({ where: { slug: 'jewelry' } });
    if (jewelryCategory) {
      // Assign product to jewelry category
      await ProductCategory.create({
        productId: testProduct.id,
        categoryId: jewelryCategory.id
      });
      console.log('✓ Assigned product to Jewelry category');
    }
    
    // Get footwear category
    const footwearCategory = await Category.findOne({ where: { slug: 'footwear' } });
    if (footwearCategory) {
      // Assign product to footwear category too (multiple categories)
      await ProductCategory.create({
        productId: testProduct.id,
        categoryId: footwearCategory.id
      });
      console.log('✓ Assigned product to Footwear category');
    }
    
    // Verify the assignments using raw query
    const productCategories = await sequelize.query(`
      SELECT c.name, c.slug
      FROM "ProductCategory" pc
      INNER JOIN "Category" c ON pc."categoryId" = c.id
      WHERE pc."productId" = :productId
    `, {
      replacements: { productId: testProduct.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('\nProduct category assignments:');
    productCategories.forEach(pc => {
      console.log(`- ${pc.name} (${pc.slug})`);
    });
    
    // Test that the product appears in category pages
    console.log('\nTesting category queries:');
    
    // Test jewelry category
    const jewelryProducts = await sequelize.query(`
      SELECT p.id, p.name
      FROM "Product" p
      INNER JOIN "ProductCategory" pc ON p.id = pc."productId"
      WHERE pc."categoryId" = :categoryId AND p."isActive" = true
    `, {
      replacements: { categoryId: jewelryCategory.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`Jewelry category products: ${jewelryProducts.length}`);
    jewelryProducts.forEach(prod => console.log(`  - ${prod.name}`));
    
    // Test footwear category
    const footwearProducts = await sequelize.query(`
      SELECT p.id, p.name
      FROM "Product" p
      INNER JOIN "ProductCategory" pc ON p.id = pc."productId"
      WHERE pc."categoryId" = :categoryId AND p."isActive" = true
    `, {
      replacements: { categoryId: footwearCategory.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`Footwear category products: ${footwearProducts.length}`);
    footwearProducts.forEach(prod => console.log(`  - ${prod.name}`));
    
    console.log('\n✅ Product creation and category assignment test completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testProductCreation();
