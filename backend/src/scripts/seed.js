/*
  Production-safe admin seed script:
  - Requires ADMIN_SEED_TOKEN environment variable for security
  - Creates a single admin user with secure random password
  - Only runs if no admin users exist
  - Prints credentials once and exits
*/

require('dotenv').config();
const crypto = require('crypto');

const { sequelize } = require('../config/database');

// Ensure models/associations are registered
require('../models/User');
require('../models/Category');
require('../models/Product');
require('../models/ProductCategory');
require('../models/Collection');
require('../models/ProductCollection');
require('../models/Order');
require('../models/OrderItem');
require('../models/Cart');
require('../models/Wishlist');
require('../models/associations');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

async function seed() {
  try {
    // Security check: require token
    const requiredToken = process.env.ADMIN_SEED_TOKEN;
    if (!requiredToken) {
      console.error('❌ ADMIN_SEED_TOKEN environment variable is required');
      console.error('   Set ADMIN_SEED_TOKEN=your-secret-token to run this script');
      process.exit(1);
    }

    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    console.log('✅ Database connected.');

    // Check if any admin users already exist
    const existingAdmins = await User.count({ where: { isAdmin: true } });
    if (existingAdmins > 0) {
      console.log('⚠️  Admin users already exist. Skipping seed.');
      console.log('   This script only creates the first admin user.');
      process.exit(0);
    }

    // Generate secure credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@wear.local';
    const randomPassword = crypto.randomBytes(16).toString('hex');
    
    console.log(`👤 Creating admin user: ${adminEmail}`);
    const admin = await User.create({
      email: adminEmail,
      password: randomPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      isEmailVerified: true,
      isActive: true
    });
    console.log('✅ Admin user created.');

    console.log('\n🎉 Admin user created successfully!');
    console.log('📋 IMPORTANT: Save these credentials securely:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${randomPassword}`);
    console.log('\n⚠️  Security notes:');
    console.log('   - Change the password immediately after first login');
    console.log('   - Enable 2FA for additional security');
    console.log('   - This script will not run again (admin users exist)');
    console.log('   - Remove ADMIN_SEED_TOKEN from environment after use');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();


