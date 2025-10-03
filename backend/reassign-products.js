const { sequelize } = require('./src/config/database');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const ProductCategory = require('./src/models/ProductCategory');

async function reassignProducts() {
  try {
    await sequelize.authenticate();
    console.log('Reassigning products to appropriate categories...');
    
    // Clear existing relationships
    await ProductCategory.destroy({ where: {} });
    console.log('Cleared existing relationships');
    
    // Get all categories
    const categories = await Category.findAll();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat.id;
    });
    
    console.log('Available categories:', Object.keys(categoryMap));
    
    // Get all products
    const products = await Product.findAll();
    console.log(`Found ${products.length} products to reassign`);
    
    // Reassign products based on better logic
    for (const product of products) {
      let categoryId = null;
      const productName = product.name.toLowerCase();
      
      console.log(`\nProcessing product: "${product.name}"`);
      
      // Better category assignment logic
      if (productName.includes('jewelry') || productName.includes('jewerly') || productName.includes('watch') || productName.includes('ring') || productName.includes('necklace')) {
        categoryId = categoryMap['jewelry'] || categoryMap['accessories'];
        console.log(`  -> Assigned to Jewelry/Accessories`);
      } else if (productName.includes('dress') || productName.includes('skirt') || productName.includes('blouse') || productName.includes('women')) {
        categoryId = categoryMap['women'];
        console.log(`  -> Assigned to Women`);
      } else if (productName.includes('shirt') || productName.includes('pants') || productName.includes('men') || productName.includes('suit')) {
        categoryId = categoryMap['men'];
        console.log(`  -> Assigned to Men`);
      } else if (productName.includes('shoe') || productName.includes('boot') || productName.includes('sneaker') || productName.includes('sandal')) {
        categoryId = categoryMap['footwear'];
        console.log(`  -> Assigned to Footwear`);
      } else {
        // Default to women's clothing for general products
        categoryId = categoryMap['women'];
        console.log(`  -> Defaulted to Women`);
      }
      
      if (categoryId) {
        await ProductCategory.create({
          productId: product.id,
          categoryId: categoryId
        });
        console.log(`  ✓ Created relationship: Product ${product.id} -> Category ${categoryId}`);
      } else {
        console.log(`  ✗ No category found for product "${product.name}"`);
      }
    }
    
    console.log('\n=== FINAL ASSIGNMENTS ===');
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
      
      if (categoryProducts.length > 0) {
        console.log(`\n${category.name} (${category.slug}):`);
        categoryProducts.forEach(prod => console.log(`  - ${prod.name}`));
      }
    }
    
    console.log('\nProduct reassignment completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

reassignProducts();


