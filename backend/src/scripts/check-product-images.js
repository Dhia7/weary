require('dotenv').config();
const { connectDB } = require('../config/database');
const Product = require('../models/Product');

(async () => {
  try {
    await connectDB();
    const products = await Product.findAll({
      attributes: ['id', 'name', 'imageUrl', 'images'],
      raw: false
    });

    console.log('\n📦 PRODUCTS AND THEIR IMAGES:\n');
    console.log('='.repeat(60));
    
    products.forEach(p => {
      console.log(`\n${p.name} (ID: ${p.id}):`);
      if (p.imageUrl) {
        console.log(`  ✅ imageUrl: ${p.imageUrl}`);
      }
      if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        console.log(`  ✅ images array (${p.images.length} images):`);
        p.images.forEach((img, idx) => {
          console.log(`     [${idx}] ${img}`);
        });
      } else {
        console.log('  ⚠️  No images array');
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`\nTotal products: ${products.length}\n`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
