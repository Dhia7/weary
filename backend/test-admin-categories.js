const { sequelize } = require('./src/config/database');
const Category = require('./src/models/Category');

async function testAdminCategories() {
  try {
    await sequelize.authenticate();
    console.log('Testing admin categories endpoint...');
    
    // Get all active categories (what the admin endpoint should return)
    const categories = await Category.findAll({ 
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    
    console.log('Active categories for admin:');
    categories.forEach(cat => console.log(`- ${cat.name} (${cat.slug}) - ID: ${cat.id}`));
    
    // Check if the specific categories we need are there
    const requiredCategories = ['footwear', 'jewelry', 'activewear'];
    console.log('\nChecking required categories:');
    
    for (const slug of requiredCategories) {
      const category = await Category.findOne({ where: { slug, isActive: true } });
      if (category) {
        console.log(`✓ ${category.name} (${category.slug}) - ID: ${category.id}`);
      } else {
        console.log(`✗ ${slug} - NOT FOUND or INACTIVE`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAdminCategories();


