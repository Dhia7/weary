const User = require('../models/User');

/**
 * Automatically create admin account from environment variables on startup
 * Only creates if ADMIN_EMAIL and ADMIN_PASSWORD are set and no admin exists
 */
async function autoCreateAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Only create if both email and password are provided
    if (!adminEmail || !adminPassword) {
      return; // Silently skip if not configured
    }

    // Check if any admin users already exist
    const existingAdmins = await User.count({ where: { isAdmin: true } });
    if (existingAdmins > 0) {
      console.log('✅ Admin users already exist. Skipping auto-creation.');
      return;
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email: adminEmail } });
    if (existingUser) {
      // Update existing user to admin
      existingUser.isAdmin = true;
      existingUser.isEmailVerified = true;
      existingUser.isActive = true;
      if (adminPassword) {
        existingUser.password = adminPassword; // Will be hashed by model hook
      }
      await existingUser.save();
      console.log(`✅ Updated existing user ${adminEmail} to admin.`);
      return;
    }

    // Create new admin user
    console.log(`👤 Creating admin user from environment variables: ${adminEmail}`);
    await User.create({
      email: adminEmail,
      password: adminPassword,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'User',
      isAdmin: true,
      isEmailVerified: true,
      isActive: true
    });
    console.log(`✅ Admin account created successfully: ${adminEmail}`);
    console.log('⚠️  Security: Remove ADMIN_PASSWORD from environment variables after first login!');
  } catch (error) {
    console.error('❌ Failed to auto-create admin account:', error.message);
    // Don't throw - allow server to start even if admin creation fails
  }
}

module.exports = { autoCreateAdmin };
