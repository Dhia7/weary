/*
  Admin account creation script:
  - Creates an admin user account
  - Can be run multiple times (unlike seed.js)
  - Accepts email and password via command line or environment variables
  - If email already exists, updates the user to admin instead of creating new
*/

require('dotenv').config();
const readline = require('readline');

const { sequelize, connectDB } = require('../config/database');

// Ensure models/associations are registered
require('../models/User');
require('../models/associations');

const User = require('../models/User');

// Helper to get input from user
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function createAdmin() {
  try {
    console.log('🔧 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected.\n');

    // Get email from command line args, env var, or prompt
    let email = process.argv[2] || process.env.ADMIN_EMAIL;
    let password = process.argv[3] || process.env.ADMIN_PASSWORD;
    let firstName = process.argv[4] || process.env.ADMIN_FIRST_NAME || 'Admin';
    let lastName = process.argv[5] || process.env.ADMIN_LAST_NAME || 'User';

    // Prompt for email if not provided
    if (!email) {
      email = await askQuestion('Enter admin email: ');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      // User exists - update to admin
      if (existingUser.isAdmin) {
        console.log(`⚠️  User ${email} is already an admin.`);
        process.exit(0);
      }

      console.log(`👤 User ${email} exists. Updating to admin...`);
      
      // Update password if provided
      if (password) {
        existingUser.password = password;
      }
      
      existingUser.isAdmin = true;
      existingUser.isEmailVerified = true;
      existingUser.isActive = true;
      
      await existingUser.save();
      
      console.log('✅ User updated to admin successfully!');
      if (password) {
        console.log(`📋 Updated password for: ${email}`);
      } else {
        console.log(`📋 Password unchanged for: ${email}`);
      }
      process.exit(0);
    }

    // User doesn't exist - create new admin
    // Prompt for password if not provided
    if (!password) {
      password = await askQuestion('Enter admin password (min 6 characters): ');
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    // Prompt for first name if not provided
    if (!process.argv[4] && !process.env.ADMIN_FIRST_NAME) {
      const customFirstName = await askQuestion(`Enter first name (default: ${firstName}): `);
      if (customFirstName.trim()) {
        firstName = customFirstName.trim();
      }
    }

    // Prompt for last name if not provided
    if (!process.argv[5] && !process.env.ADMIN_LAST_NAME) {
      const customLastName = await askQuestion(`Enter last name (default: ${lastName}): `);
      if (customLastName.trim()) {
        lastName = customLastName.trim();
      }
    }

    console.log(`👤 Creating admin user: ${email}`);
    
    const admin = await User.create({
      email,
      password,
      firstName,
      lastName,
      isAdmin: true,
      isEmailVerified: true,
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log('\n⚠️  Security notes:');
    console.log('   - Change the password immediately after first login');
    console.log('   - Enable 2FA for additional security');

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create admin:', err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.error('   Email already exists. Use update-admin.js to convert existing user to admin.');
    }
    process.exit(1);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node create-admin.js [email] [password] [firstName] [lastName]

Options:
  email       Admin email address (required if not in env)
  password    Admin password, min 6 characters (required if not in env)
  firstName   First name (default: "Admin")
  lastName    Last name (default: "User")

Environment variables:
  ADMIN_EMAIL         Admin email address
  ADMIN_PASSWORD      Admin password
  ADMIN_FIRST_NAME    First name
  ADMIN_LAST_NAME     Last name

Examples:
  node create-admin.js admin@example.com mypassword123
  node create-admin.js admin@example.com mypassword123 John Doe
  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=pass123 node create-admin.js

Note: If the email already exists, the user will be updated to admin status.
`);
  process.exit(0);
}

createAdmin();
