require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/database');
const Product = require('../models/Product');

/**
 * Script to identify and optionally delete unused product images
 * Usage: node src/scripts/cleanup-unused-images.js [--dry-run] [--delete]
 * 
 * --dry-run: Only show what would be deleted (default)
 * --delete: Actually delete the unused images
 */

async function cleanupUnusedImages() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all products
    const products = await Product.findAll({
      attributes: ['id', 'name', 'imageUrl', 'images'],
      raw: false
    });

    console.log(`📦 Found ${products.length} products in database\n`);

    // Extract all image filenames from database
    const usedImageFilenames = new Set();

    products.forEach(product => {
      // Add imageUrl if exists
      if (product.imageUrl) {
        const filename = extractFilename(product.imageUrl);
        if (filename) {
          usedImageFilenames.add(filename);
        }
      }

      // Add images from images array
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(imageUrl => {
          if (imageUrl) {
            const filename = extractFilename(imageUrl);
            if (filename) {
              usedImageFilenames.add(filename);
            }
          }
        });
      }
    });

    console.log(`📸 Found ${usedImageFilenames.size} unique image references in database\n`);

    // Get all files in uploads directory
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.error(`❌ Uploads directory not found: ${uploadsDir}`);
      process.exit(1);
    }

    const allFiles = fs.readdirSync(uploadsDir).filter(file => {
      const filePath = path.join(uploadsDir, file);
      return fs.statSync(filePath).isFile();
    });

    console.log(`📁 Found ${allFiles.length} files in uploads directory\n`);

    // Find unused images (only product images, not other files)
    const unusedImages = allFiles.filter(file => {
      // Only check product images (files starting with "product-")
      if (!file.startsWith('product-')) {
        return false;
      }
      return !usedImageFilenames.has(file);
    });

    // Display results
    console.log('='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total files in uploads: ${allFiles.length}`);
    console.log(`Product images referenced in DB: ${usedImageFilenames.size}`);
    console.log(`Unused product images: ${unusedImages.length}`);
    console.log('='.repeat(60));
    console.log('');

    if (unusedImages.length === 0) {
      console.log('✅ No unused images found! All images are in use.');
      process.exit(0);
    }

    // Show unused images
    console.log('🗑️  UNUSED PRODUCT IMAGES:');
    console.log('-'.repeat(60));
    unusedImages.forEach((file, index) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`${index + 1}. ${file} (${sizeMB} MB)`);
    });
    console.log('-'.repeat(60));
    console.log('');

    // Calculate total size
    const totalSize = unusedImages.reduce((sum, file) => {
      const filePath = path.join(uploadsDir, file);
      return sum + fs.statSync(filePath).size;
    }, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`💾 Total size of unused images: ${totalSizeMB} MB\n`);

    // Check command line arguments
    const args = process.argv.slice(2);
    const shouldDelete = args.includes('--delete');
    const isDryRun = !shouldDelete || args.includes('--dry-run');

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No files will be deleted');
      console.log('💡 To actually delete these files, run: node src/scripts/cleanup-unused-images.js --delete\n');
    } else {
      console.log('⚠️  DELETION MODE - Files will be permanently deleted!');
      console.log('Press Ctrl+C within 5 seconds to cancel...\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Delete unused images
      let deletedCount = 0;
      let errorCount = 0;

      for (const file of unusedImages) {
        try {
          const filePath = path.join(uploadsDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`✅ Deleted: ${file}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Error deleting ${file}:`, error.message);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 DELETION SUMMARY');
      console.log('='.repeat(60));
      console.log(`Successfully deleted: ${deletedCount} files`);
      if (errorCount > 0) {
        console.log(`Errors: ${errorCount} files`);
      }
      console.log(`Freed space: ${totalSizeMB} MB`);
      console.log('='.repeat(60));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Extract filename from image URL/path
 * Handles various formats:
 * - /uploads/product-123.jpg
 * - uploads/product-123.jpg
 * - http://localhost:3001/uploads/product-123.jpg
 * - product-123.jpg
 */
function extractFilename(imagePath) {
  if (!imagePath) return null;

  // Remove query parameters
  const withoutQuery = imagePath.split('?')[0];

  // Extract filename from path
  const filename = path.basename(withoutQuery);

  // Only return if it's a product image
  if (filename.startsWith('product-')) {
    return filename;
  }

  return null;
}

// Run the script
cleanupUnusedImages();
