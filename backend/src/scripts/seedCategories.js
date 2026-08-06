/*
  Category seed script:
  - Creates bag categories for the Swisia store
  - Safe to run multiple times (won't create duplicates)
  - Categories: Totes, Handbags, Crossbody bags, Clutches, Travel bags
*/

require('dotenv').config();

const { sequelize } = require('../config/database');

// Ensure models/associations are registered
require('../models/Category');
require('../models/associations');

const Category = require('../models/Category');

const defaultCategories = [
  {
    name: 'Totes',
    slug: 'totes',
    description: 'Everyday tote bags — from canvas to leather',
    isActive: true
  },
  {
    name: 'Handbags',
    slug: 'handbags',
    description: 'Top-handle and structured handbags',
    isActive: true
  },
  {
    name: 'Crossbody bags',
    slug: 'crossbody-bags',
    description: 'Bags with a crossbody strap for hands-free wear',
    isActive: true
  },
  {
    name: 'Clutches',
    slug: 'clutches',
    description: 'Evening and compact clutch bags',
    isActive: true
  },
  {
    name: 'Travel bags',
    slug: 'travel-bags',
    description: 'Weekenders and travel-ready bags',
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
      console.log(`   - ${cat.name} (ID: ${cat.id}, slug: ${cat.slug}, active: ${cat.isActive})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Category seed failed:', err);
    process.exit(1);
  }
}

seedCategories();
