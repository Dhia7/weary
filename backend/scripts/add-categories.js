#!/usr/bin/env node

/**
 * Add categories to the database
 * This script adds common categories including "footwear"
 */

require('dotenv').config();
const { sequelize, connectDB } = require('../src/config/database');
const Category = require('../src/models/Category');

// Define categories to add
const categoriesToAdd = [
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Shoes, boots, sneakers, and all types of footwear for men, women, and children',
    isActive: true
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Apparel and clothing items including shirts, pants, dresses, and more',
    isActive: true
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion accessories including bags, jewelry, watches, and more',
    isActive: true
  },
  {
    name: 'Men',
    slug: 'men',
    description: 'Men\'s clothing, footwear, and accessories',
    isActive: true
  },
  {
    name: 'Women',
    slug: 'women',
    description: 'Women\'s clothing, footwear, and accessories',
    isActive: true
  },
  {
    name: 'Kids',
    slug: 'kids',
    description: 'Children\'s clothing, footwear, and accessories',
    isActive: true
  },
  {
    name: 'Sneakers',
    slug: 'sneakers',
    description: 'Athletic and casual sneakers for all ages',
    isActive: true
  },
  {
    name: 'Boots',
    slug: 'boots',
    description: 'All types of boots including work boots, fashion boots, and hiking boots',
    isActive: true
  },
  {
    name: 'Sandals',
    slug: 'sandals',
    description: 'Summer footwear including flip-flops, slides, and sandals',
    isActive: true
  }
];

async function addCategories() {
  try {
    console.log('🚀 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully\n');

    console.log('📝 Adding categories to database...\n');

    let addedCount = 0;
    let skippedCount = 0;

    for (const categoryData of categoriesToAdd) {
      try {
        // Check if category already exists
        const existingCategory = await Category.findOne({
          where: {
            [require('sequelize').Op.or]: [
              { slug: categoryData.slug },
              { name: categoryData.name }
            ]
          }
        });

        if (existingCategory) {
          console.log(`⏭️  Skipped "${categoryData.name}" - already exists (slug: ${existingCategory.slug})`);
          skippedCount++;
          continue;
        }

        // Create new category
        const category = await Category.create(categoryData);
        console.log(`✅ Added "${category.name}" (slug: ${category.slug})`);
        addedCount++;

      } catch (error) {
        console.error(`❌ Failed to add "${categoryData.name}":`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Categories added: ${addedCount}`);
    console.log(`⏭️  Categories skipped: ${skippedCount}`);
    console.log(`📝 Total processed: ${categoriesToAdd.length}`);

    // Show all current categories
    console.log('\n📋 Current categories in database:');
    const allCategories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    allCategories.forEach(category => {
      console.log(`   • ${category.name} (${category.slug})`);
    });

    console.log('\n🎉 Category setup completed successfully!');

  } catch (error) {
    console.error('❌ Error adding categories:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  addCategories();
}

module.exports = addCategories;



