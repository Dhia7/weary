/*
  Category seed script:
  - Creates default categories for the e-commerce store
  - Safe to run multiple times (won't create duplicates)
  - Categories: Women, Men, Accessories, Footwear, Jewelry, Activewear
*/

require('dotenv').config();

const { sequelize } = require('../config/database');

// Ensure models/associations are registered
require('../models/Category');
require('../models/associations');

const Category = require('../models/Category');

const defaultCategories = [
  {
    name: 'Women',
    slug: 'women',
    description: 'Women\'s clothing and fashion',
    isActive: true
  },
  {
    name: 'Men',
    slug: 'men',
    description: 'Men\'s clothing and fashion',
    isActive: true
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion accessories and add-ons',
    isActive: true
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Shoes, boots, and footwear',
    isActive: true
  },
  {
    name: 'Jewelry',
    slug: 'jewelry',
    description: 'Jewelry and accessories',
    isActive: true
  },
  {
    name: 'Activewear',
    slug: 'activewear',
    description: 'Athletic and sportswear',
    isActive: true
  }
];

async function seedCategories() {
  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    console.log('✅ Database connected.');

    console.log('📦 Seeding categories...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const categoryData of defaultCategories) {
      try {
        // Check if category already exists by slug
        const existing = await Category.findOne({ 
          where: { slug: categoryData.slug } 
        });

        if (existing) {
          console.log(`⏭️  Category "${categoryData.name}" already exists, skipping...`);
          skippedCount++;
        } else {
          const category = await Category.create(categoryData);
          console.log(`✅ Created category: ${category.name} (ID: ${category.id})`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating category "${categoryData.name}":`, error.message);
      }
    }

    console.log('\n🎉 Category seeding completed!');
    console.log(`   Created: ${createdCount} categories`);
    console.log(`   Skipped: ${skippedCount} categories (already exist)`);
    
    // List all categories
    const allCategories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    console.log('\n📋 All categories in database:');
    allCategories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, slug: ${cat.slug})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Category seed failed:', err);
    process.exit(1);
  }
}

seedCategories();

