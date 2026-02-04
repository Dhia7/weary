require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/database');
const Product = require('../models/Product');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

/**
 * Migration script to upload existing local images to Cloudinary
 * 
 * This script:
 * 1. Finds all products with local image URLs (/uploads/...)
 * 2. Uploads those images to Cloudinary
 * 3. Updates the product records with Cloudinary URLs
 * 
 * Usage: node src/scripts/migrate-images-to-cloudinary.js [--dry-run]
 * 
 * --dry-run: Only show what would be migrated, don't actually upload
 */

async function migrateImagesToCloudinary() {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.error('❌ Cloudinary is not configured!');
      console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
      process.exit(1);
    }

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all products
    const products = await Product.findAll({
      attributes: ['id', 'name', 'imageUrl', 'images'],
      raw: false
    });

    console.log(`📦 Found ${products.length} products in database\n`);

    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    const uploadsDir = path.resolve(__dirname, '../../uploads');
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      const updates = {};
      let needsUpdate = false;

      // Check imageUrl
      if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
        const filename = path.basename(product.imageUrl);
        const filePath = path.join(uploadsDir, filename);

        if (fs.existsSync(filePath)) {
          if (!isDryRun) {
            try {
              const cloudinaryUrl = await uploadToCloudinary(filePath);
              if (cloudinaryUrl) {
                updates.imageUrl = cloudinaryUrl;
                needsUpdate = true;
                console.log(`✅ Migrated imageUrl for "${product.name}": ${cloudinaryUrl}`);
              }
            } catch (error) {
              console.error(`❌ Error migrating imageUrl for "${product.name}":`, error.message);
              errorCount++;
            }
          } else {
            console.log(`📋 Would migrate imageUrl: ${product.imageUrl} → Cloudinary`);
            needsUpdate = true;
          }
        } else {
          console.log(`⚠️  File not found: ${filePath} (product: ${product.name})`);
          skippedCount++;
        }
      }

      // Check images array
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const migratedImages = [];
        let imagesNeedsUpdate = false;

        for (let i = 0; i < product.images.length; i++) {
          const imageUrl = product.images[i];

          // Skip if already a Cloudinary URL
          if (imageUrl && imageUrl.includes('cloudinary.com')) {
            migratedImages.push(imageUrl);
            continue;
          }

          // Migrate local images
          if (imageUrl && imageUrl.startsWith('/uploads/')) {
            const filename = path.basename(imageUrl);
            const filePath = path.join(uploadsDir, filename);

            if (fs.existsSync(filePath)) {
              if (!isDryRun) {
                try {
                  const cloudinaryUrl = await uploadToCloudinary(filePath);
                  if (cloudinaryUrl) {
                    migratedImages.push(cloudinaryUrl);
                    imagesNeedsUpdate = true;
                    console.log(`  ✅ Migrated image [${i}] for "${product.name}": ${cloudinaryUrl}`);
                  } else {
                    migratedImages.push(imageUrl); // Keep original if upload fails
                  }
                } catch (error) {
                  console.error(`  ❌ Error migrating image [${i}] for "${product.name}":`, error.message);
                  migratedImages.push(imageUrl); // Keep original on error
                  errorCount++;
                }
              } else {
                console.log(`  📋 Would migrate image [${i}]: ${imageUrl} → Cloudinary`);
                imagesNeedsUpdate = true;
              }
            } else {
              console.log(`  ⚠️  File not found: ${filePath} (product: ${product.name}, image [${i}])`);
              migratedImages.push(imageUrl); // Keep original if file doesn't exist
              skippedCount++;
            }
          } else {
            // Keep non-local URLs as-is
            migratedImages.push(imageUrl);
          }
        }

        if (imagesNeedsUpdate) {
          updates.images = migratedImages;
          needsUpdate = true;
        }
      }

      // Update product if needed
      if (needsUpdate && !isDryRun) {
        try {
          await product.update(updates);
          migratedCount++;
          console.log(`✅ Updated product "${product.name}" (ID: ${product.id})\n`);
        } catch (error) {
          console.error(`❌ Error updating product "${product.name}":`, error.message);
          errorCount++;
        }
      } else if (needsUpdate && isDryRun) {
        migratedCount++;
        console.log(`📋 Would update product "${product.name}" (ID: ${product.id})\n`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Products processed: ${products.length}`);
    console.log(`Products migrated: ${migratedCount}`);
    console.log(`Files skipped (not found): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (isDryRun) {
      console.log('\n💡 To actually migrate images, run without --dry-run flag:');
      console.log('   node src/scripts/migrate-images-to-cloudinary.js\n');
    } else {
      console.log('\n✅ Migration complete!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateImagesToCloudinary();
