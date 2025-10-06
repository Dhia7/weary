#!/usr/bin/env node

/**
 * Add footwear category to the database
 * Simple script to add just the footwear category
 */

require('dotenv').config();
const { sequelize, connectDB } = require('../src/config/database');
const Category = require('../src/models/Category');

async function addFootwearCategory() {
  try {
    console.log('🚀 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully\n');

    // Check if footwear category already exists
    const existingCategory = await Category.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { slug: 'footwear' },
          { name: 'Footwear' }
        ]
      }
    });

    if (existingCategory) {
      console.log(`✅ Footwear category already exists:`);
      console.log(`   Name: ${existingCategory.name}`);
      console.log(`   Slug: ${existingCategory.slug}`);
      console.log(`   Description: ${existingCategory.description}`);
      console.log(`   Active: ${existingCategory.isActive}`);
      console.log(`   Created: ${existingCategory.createdAt}`);
      return;
    }

    // Create footwear category
    console.log('📝 Creating footwear category...');
    const footwearCategory = await Category.create({
      name: 'Footwear',
      slug: 'footwear',
      description: 'Shoes, boots, sneakers, and all types of footwear for men, women, and children',
      isActive: true
    });

    console.log('✅ Footwear category created successfully!');
    console.log(`   ID: ${footwearCategory.id}`);
    console.log(`   Name: ${footwearCategory.name}`);
    console.log(`   Slug: ${footwearCategory.slug}`);
    console.log(`   Description: ${footwearCategory.description}`);

    console.log('\n🎉 You can now use the footwear category in your application!');

  } catch (error) {
    console.error('❌ Error creating footwear category:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  addFootwearCategory();
}

module.exports = addFootwearCategory;


