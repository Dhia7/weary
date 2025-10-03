const { sequelize } = require('./src/config/database');
const Category = require('./src/models/Category');

async function createMissingCategories() {
  try {
    await sequelize.authenticate();
    console.log('Creating missing categories...');
    
    const categoriesToCreate = [
      { name: 'Women', slug: 'women', description: 'Women\'s clothing and accessories' },
      { name: 'Men', slug: 'men', description: 'Men\'s clothing and accessories' },
      { name: 'Footwear', slug: 'footwear', description: 'Shoes and footwear for all genders' },
      { name: 'Jewelry', slug: 'jewelry', description: 'Jewelry and accessories' }
    ];
    
    for (const categoryData of categoriesToCreate) {
      const existing = await Category.findOne({ where: { slug: categoryData.slug } });
      if (!existing) {
        const category = await Category.create({
          ...categoryData,
          isActive: true
        });
        console.log(`Created category: ${category.name} (${category.slug})`);
      } else {
        console.log(`Category already exists: ${existing.name} (${existing.slug})`);
      }
    }
    
    console.log('\nAll categories created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createMissingCategories();


