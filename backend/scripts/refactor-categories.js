#!/usr/bin/env node

/**
 * Refactor categories in the database
 * This script removes unwanted categories and ensures only the specified ones exist:
 * women, men, accessories, footwear, jewelry, activewear
 */

require('dotenv').config();
const { sequelize, connectDB } = require('../src/config/database');
const Category = require('../src/models/Category');
const ProductCategory = require('../src/models/ProductCategory');

// Define the exact categories we want to keep
const targetCategories = [
  {
    name: 'Women',
    slug: 'women',
    description: 'Women\'s clothing, footwear, and accessories',
    isActive: true
  },
  {
    name: 'Men',
    slug: 'men',
    description: 'Men\'s clothing, footwear, and accessories',
    isActive: true
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion accessories including bags, jewelry, watches, and more',
    isActive: true
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Shoes, boots, sneakers, and all types of footwear for men, women, and children',
    isActive: true
  },
  {
    name: 'Jewelry',
    slug: 'jewelry',
    description: 'Rings, necklaces, bracelets, earrings, and all types of jewelry',
    isActive: true
  },
  {
    name: 'Activewear',
    slug: 'activewear',
    description: 'Athletic and sportswear including workout clothes, sports bras, and athletic gear',
    isActive: true
  }
];

async function refactorCategories() {
  try {
    console.log('🚀 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully\n');

    console.log('🔄 Starting category refactoring...\n');

    // Step 1: Get all current categories
    console.log('📋 Current categories in database:');
    const allCategories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    allCategories.forEach(category => {
      console.log(`   • ${category.name} (${category.slug}) - ID: ${category.id}`);
    });
    console.log('');

    // Step 2: Identify categories to remove
    const targetSlugs = targetCategories.map(cat => cat.slug);
    const categoriesToRemove = allCategories.filter(cat => !targetSlugs.includes(cat.slug));

    if (categoriesToRemove.length > 0) {
      console.log('🗑️  Categories to remove:');
      categoriesToRemove.forEach(category => {
        console.log(`   • ${category.name} (${category.slug}) - ID: ${category.id}`);
      });
      console.log('');

      // Step 3: Check if any products are assigned to categories we want to remove
      console.log('🔍 Checking for products assigned to categories that will be removed...');
      
      for (const category of categoriesToRemove) {
        const productCount = await ProductCategory.count({
          where: { categoryId: category.id }
        });
        
        if (productCount > 0) {
          console.log(`⚠️  Warning: ${productCount} products are assigned to "${category.name}" category`);
          console.log(`   These products will be unassigned from this category`);
        }
      }
      console.log('');

      // Step 4: Remove product-category associations for categories being deleted
      console.log('🔗 Removing product-category associations...');
      for (const category of categoriesToRemove) {
        const deletedAssociations = await ProductCategory.destroy({
          where: { categoryId: category.id }
        });
        if (deletedAssociations > 0) {
          console.log(`   ✅ Removed ${deletedAssociations} product associations from "${category.name}"`);
        }
      }
      console.log('');

      // Step 5: Delete unwanted categories
      console.log('🗑️  Deleting unwanted categories...');
      for (const category of categoriesToRemove) {
        await category.destroy();
        console.log(`   ✅ Deleted "${category.name}" (${category.slug})`);
      }
      console.log('');
    } else {
      console.log('✅ No unwanted categories found to remove.\n');
    }

    // Step 6: Ensure all target categories exist
    console.log('📝 Ensuring all target categories exist...');
    let createdCount = 0;
    let updatedCount = 0;

    for (const targetCategory of targetCategories) {
      let category = await Category.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { slug: targetCategory.slug },
            { name: targetCategory.name }
          ]
        }
      });

      if (!category) {
        // Create new category
        category = await Category.create(targetCategory);
        console.log(`   ✅ Created "${targetCategory.name}" (${targetCategory.slug})`);
        createdCount++;
      } else {
        // Update existing category to match target
        const needsUpdate = 
          category.name !== targetCategory.name ||
          category.description !== targetCategory.description ||
          category.isActive !== targetCategory.isActive;

        if (needsUpdate) {
          await category.update({
            name: targetCategory.name,
            description: targetCategory.description,
            isActive: targetCategory.isActive
          });
          console.log(`   🔄 Updated "${targetCategory.name}" (${targetCategory.slug})`);
          updatedCount++;
        } else {
          console.log(`   ✅ "${targetCategory.name}" (${targetCategory.slug}) - already correct`);
        }
      }
    }

    console.log('');

    // Step 7: Show final result
    console.log('🎉 Category refactoring completed!');
    console.log(`✅ Categories created: ${createdCount}`);
    console.log(`🔄 Categories updated: ${updatedCount}`);
    console.log(`🗑️  Categories removed: ${categoriesToRemove.length}`);

    console.log('\n📋 Final categories in database:');
    const finalCategories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    finalCategories.forEach(category => {
      console.log(`   • ${category.name} (${category.slug}) - ID: ${category.id}`);
    });

    console.log('\n🎯 Your database now contains exactly the categories you requested!');

  } catch (error) {
    console.error('❌ Error refactoring categories:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  refactorCategories();
}

module.exports = refactorCategories;

