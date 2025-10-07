const { sequelize } = require('./src/config/database');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const ProductCategory = require('./src/models/ProductCategory');

async function assignCategories() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Get all categories
    const categories = await Category.findAll();
    console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
    
    // Get all products
    const products = await Product.findAll();
    console.log('Total products:', products.length);
    
    // Clear existing relationships
    await ProductCategory.destroy({ where: {} });
    console.log('Cleared existing product-category relationships');
    
    // Assign categories to products based on their names or other criteria
    for (const product of products) {
      let categoryId = null;
      
      // Simple category assignment logic based on product name
      const productName = product.name.toLowerCase();
      
      if (productName.includes('watch') || productName.includes('jewelry') || productName.includes('jewerly')) {
        categoryId = categories.find(c => c.slug === 'accessories')?.id;
      } else if (productName.includes('dress') || productName.includes('skirt') || productName.includes('blouse')) {
        categoryId = categories.find(c => c.slug === 'dresses')?.id;
      } else if (productName.includes('shirt') || productName.includes('top') || productName.includes('blouse')) {
        categoryId = categories.find(c => c.slug === 'tops')?.id;
      } else if (productName.includes('pant') || productName.includes('jean') || productName.includes('short')) {
        categoryId = categories.find(c => c.slug === 'bottoms')?.id;
      } else if (productName.includes('jacket') || productName.includes('coat') || productName.includes('sweater')) {
        categoryId = categories.find(c => c.slug === 'outerwear')?.id;
      } else if (productName.includes('sport') || productName.includes('gym') || productName.includes('active')) {
        categoryId = categories.find(c => c.slug === 'activewear')?.id;
      } else if (productName.includes('shoe') || productName.includes('boot') || productName.includes('sneaker')) {
        categoryId = categories.find(c => c.slug === 'shoes')?.id;
      } else {
        // Default to clothing category
        categoryId = categories.find(c => c.slug === 'clothing')?.id;
      }
      
      if (categoryId) {
        await ProductCategory.create({
          productId: product.id,
          categoryId: categoryId
        });
        console.log(`Assigned product "${product.name}" to category ID ${categoryId}`);
      } else {
        console.log(`No category found for product "${product.name}"`);
      }
    }
    
    console.log('Category assignment completed!');
    
    // Verify the assignments
    const relationships = await ProductCategory.findAll();
    console.log('Total product-category relationships created:', relationships.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignCategories();




