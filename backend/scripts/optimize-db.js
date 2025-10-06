#!/usr/bin/env node

/**
 * Database optimization script
 * Run this script to optimize your database for better performance
 */

require('dotenv').config();
const { sequelize, connectDB } = require('../src/config/database');
const { createIndexes, analyzePerformance, optimizeSettings } = require('../src/utils/dbOptimization');

async function main() {
  try {
    console.log('🚀 Starting database optimization...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully\n');
    
    // Create indexes
    await createIndexes();
    console.log('');
    
    // Apply optimizations
    await optimizeSettings();
    console.log('');
    
    // Analyze performance
    await analyzePerformance();
    console.log('');
    
    console.log('🎉 Database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;


