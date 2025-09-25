const User = require('../models/User');
const Address = require('../models/Address');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_here_make_it_long_and_secure_for_development_only', {
    expiresIn: '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone
    });

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Handle failed login attempt
      await User.handleFailedLogin(user.id);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    await User.resetLoginAttempts(user.id);

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          isEmailVerified: user.isEmailVerified,
          isAdmin: user.isAdmin,
          preferences: user.preferences
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // Use the user data that was already fetched in the middleware
    const user = req.userData;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          phone: user.phone,
          addresses: user.addresses || [],
          isEmailVerified: user.isEmailVerified,
          isAdmin: user.isAdmin,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, preferences } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          phone: user.phone,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update user profile (comprehensive)
// @route   PUT /api/auth/profile/update
// @access  Private
const updateProfileComprehensive = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      firstName, 
      lastName, 
      phone, 
      preferences,
      addresses 
    } = req.body;
    
    const user = await User.findByPk(req.user.userId, {
      include: [{
        model: Address,
        as: 'addresses'
      }]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic profile fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    
    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    // Update addresses if provided
    if (addresses && Array.isArray(addresses)) {
      // Delete existing addresses
      await Address.destroy({ where: { userId: user.id } });
      
      // Create new addresses
      for (const address of addresses) {
        await Address.create({
          ...address,
          userId: user.id
        });
      }
    }

    await user.save();

    // Fetch updated user with addresses
    const updatedUser = await User.findByPk(user.id, {
      include: [{
        model: Address,
        as: 'addresses'
      }]
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          fullName: updatedUser.getFullName(),
          phone: updatedUser.phone,
          addresses: updatedUser.addresses || [],
          isEmailVerified: updatedUser.isEmailVerified,
          preferences: updatedUser.preferences,
          createdAt: updatedUser.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile comprehensive error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // TODO: Send email with reset token
    // For now, just return the token (in production, send via email)
    res.json({
      success: true,
      message: 'Password reset email sent',
      data: {
        resetToken // Remove this in production
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect. Please enter your current password correctly.'
      });
    }

    // Check if new password is the same as current password
    const isNewPasswordSameAsCurrent = await user.comparePassword(newPassword);
    if (isNewPasswordSameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password. Please choose a different password.'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Enable/Disable two-factor authentication
// @route   PUT /api/auth/2fa
// @access  Private
const toggleTwoFactorAuth = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { enable, password } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password before enabling/disabling 2FA
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect. Please enter your current password to enable/disable 2FA.'
      });
    }

    if (enable) {
      // Generate 2FA secret (in production, use a proper 2FA library like speakeasy)
      const twoFactorSecret = crypto.randomBytes(20).toString('hex');
      user.twoFactorSecret = twoFactorSecret;
      user.twoFactorEnabled = true;
      
      await user.save();

      res.json({
        success: true,
        message: 'Two-factor authentication enabled',
        data: {
          secret: twoFactorSecret, // In production, show QR code instead
          backupCodes: generateBackupCodes()
        }
      });
    } else {
      user.twoFactorSecret = null;
      user.twoFactorEnabled = false;
      user.backupCodes = null;
      
      await user.save();

      res.json({
        success: true,
        message: 'Two-factor authentication disabled'
      });
    }
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Verify two-factor authentication code
// @route   POST /api/auth/2fa/verify
// @access  Private
const verifyTwoFactorCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code } = req.body;
    
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled'
      });
    }

    // In production, verify the TOTP code using a library like speakeasy
    // For now, we'll use a simple verification (replace with proper TOTP verification)
    const isValidCode = verifyTOTPCode(user.twoFactorSecret, code);
    
    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid two-factor authentication code. Please enter the 6-digit code from your authenticator app.'
      });
    }

    res.json({
      success: true,
      message: 'Two-factor authentication code verified'
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to generate backup codes
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

// Helper function to verify TOTP code (simplified for demo)
const verifyTOTPCode = (secret, code) => {
  // In production, use a proper TOTP library
  // This is a simplified verification for demo purposes
  return code.length === 6 && /^\d{6}$/.test(code);
};

// @desc    Request admin privileges (for self-promotion)
// @route   PUT /api/auth/users/:id/request-admin
// @access  Private (authenticated user can request for themselves)
const requestAdminPrivileges = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.userId;
    
    console.log('requestAdminPrivileges: Requested ID:', id, 'Type:', typeof id);
    console.log('requestAdminPrivileges: User ID from token:', requestingUserId, 'Type:', typeof requestingUserId);
    
    // Users can only request admin privileges for themselves
    if (String(id) !== String(requestingUserId)) {
      console.log('requestAdminPrivileges: ID mismatch - rejecting request');
      return res.status(403).json({
        success: false,
        message: 'You can only request admin privileges for yourself'
      });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      console.log('requestAdminPrivileges: User not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('requestAdminPrivileges: Found user:', user.email, 'Current isAdmin:', user.isAdmin);

    // For now, we'll grant admin privileges directly
    // In a real application, this might require approval from other admins
    user.isAdmin = true;
    await user.save();

    console.log('requestAdminPrivileges: Updated user isAdmin to:', user.isAdmin);

    res.json({
      success: true,
      message: 'Admin privileges granted successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Request admin privileges error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateProfileComprehensive,
  changePassword,
  toggleTwoFactorAuth,
  verifyTwoFactorCode,
  forgotPassword,
  resetPassword,
  requestAdminPrivileges,
  logout
};
