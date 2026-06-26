const User = require('../models/User');
const Address = require('../models/Address');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { hasMailTransport, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mail');
const { verifyGoogleIdToken } = require('../utils/google');
const { signAccessToken } = require('../utils/jwt');
const { resolveUserRole } = require('../config/roles');
const { generateTwoFactorSecret, verifyTotpCode } = require('../utils/totp');

const { deleteFromCloudinary } = require('../utils/cloudinary');

const formatAddress = (address) => ({
  id: address.id,
  type: address.type,
  street: address.street,
  city: address.city,
  state: address.state,
  zipCode: address.zipCode,
  country: address.country,
  isDefault: address.isDefault,
});

const formatUserProfile = (user, addresses = user.addresses || []) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.getFullName(),
  phone: user.phone || null,
  avatarUrl: user.avatarUrl || null,
  isEmailVerified: user.isEmailVerified,
  isAdmin: user.isAdmin,
  twoFactorEnabled: !!user.twoFactorEnabled,
  role: resolveUserRole(user),
  preferences: user.preferences,
  createdAt: user.createdAt,
  addresses: Array.isArray(addresses) ? addresses.map(formatAddress) : [],
});

const formatAuthUser = (user) => formatUserProfile(user, []);

// Generate JWT Token
const generateToken = (userId) => signAccessToken(userId);

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

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${frontendBase}/auth/verify-email?token=${rawVerificationToken}`;

    let emailSent = false;
    try {
      if (hasMailTransport()) {
        await sendVerificationEmail(user.email, verifyUrl, user.firstName);
        emailSent = true;
      } else {
        console.warn(
          'Email verification: set RESEND_API_KEY or SMTP_* to send verification emails.'
        );
        if (process.env.NODE_ENV === 'development') {
          console.log('[dev] Verification URL (no mail transport):', verifyUrl);
        }
      }
    } catch (err) {
      console.error('Failed to send verification email:', err.message || err);
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Account created. Check your email to verify your address before signing in.'
        : 'Account created. Verification email was not sent (configure mail or check server logs in development). You can use "Resend verification" after configuring email.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          isEmailVerified: user.isEmailVerified
        },
        requiresEmailVerification: true,
        emailSent
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

    const { email, password, twoFactorCode } = req.body;

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
      await User.handleFailedLogin(user.id);

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(403).json({
          success: false,
          code: 'TWO_FACTOR_REQUIRED',
          message: 'Two-factor authentication code is required'
        });
      }

      const isValidCode = verifyTotpCode(user.twoFactorSecret, twoFactorCode);
      if (!isValidCode) {
        await User.handleFailedLogin(user.id);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // Reset login attempts on successful login
    await User.resetLoginAttempts(user.id);

    if (!user.isEmailVerified) {
      const awaitingVerification = !!(user.emailVerificationToken || user.emailVerificationExpires);
      if (!awaitingVerification) {
        user.isEmailVerified = true;
        await user.save();
      } else {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          message:
            'Please verify your email before signing in. Check your inbox for the confirmation link.'
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatAuthUser(user),
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

// @desc    Sign in or register with Google (GIS credential)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: 'Google sign-in is not configured on the server'
      });
    }

    let payload;
    try {
      payload = await verifyGoogleIdToken(credential);
    } catch (err) {
      console.error('Google token verification failed:', err.message || err);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google sign-in token'
      });
    }

    if (!payload.sub || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Google account did not return a usable email'
      });
    }

    if (!payload.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Google email must be verified to use this sign-in method'
      });
    }

    const email = String(payload.email).toLowerCase();
    let user = await User.findOne({ where: { googleId: payload.sub } });

    if (!user) {
      user = await User.findOne({ where: { email } });
    }

    if (user) {
      if (user.googleId && user.googleId !== payload.sub) {
        return res.status(409).json({
          success: false,
          message: 'This email is already linked to a different Google account'
        });
      }

      if (!user.googleId) {
        user.googleId = payload.sub;
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;

      const gn = payload.given_name?.trim();
      const fn = payload.family_name?.trim();
      if (gn && gn.length >= 2 && gn.length <= 50) {
        user.firstName = gn;
      }
      if (fn && fn.length >= 2 && fn.length <= 50) {
        user.lastName = fn;
      }

      if (payload.picture && typeof payload.picture === 'string') {
        user.avatarUrl = payload.picture;
      }

      await user.save();
    } else {
      const gn = payload.given_name?.trim();
      const fn = payload.family_name?.trim();
      const localPart = email.split('@')[0] || 'user';
      const firstName =
        gn && gn.length >= 2 && gn.length <= 50
          ? gn
          : localPart.slice(0, 50).padEnd(2, 'x');
      const lastName =
        fn && fn.length >= 2 && fn.length <= 50
          ? fn
          : 'Member';

      user = await User.create({
        email,
        googleId: payload.sub,
        firstName,
        lastName,
        isEmailVerified: true,
        password: crypto.randomBytes(32).toString('hex'),
        avatarUrl: typeof payload.picture === 'string' ? payload.picture : null,
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    await User.resetLoginAttempts(user.id);

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatAuthUser(user),
        token
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Verify email from link token
// @route   GET /api/auth/verify-email?token=
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can sign in now.'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    const genericResponse = () =>
      res.json({
        success: true,
        message: 'If an account exists and still needs verification, a new email was sent.'
      });

    if (!user || user.isEmailVerified) {
      return genericResponse();
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${frontendBase}/auth/verify-email?token=${rawToken}`;

    try {
      if (hasMailTransport()) {
        await sendVerificationEmail(user.email, verifyUrl, user.firstName);
      } else {
        console.warn('Resend verification: no mail transport configured.');
        if (process.env.NODE_ENV === 'development') {
          console.log('[dev] Verification URL:', verifyUrl);
        }
      }
    } catch (err) {
      console.error('Resend verification email failed:', err.message || err);
    }

    return genericResponse();
  } catch (error) {
    console.error('Resend verification error:', error);
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
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] },
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

    res.json({
      success: true,
      data: {
        user: formatUserProfile(user)
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
        user: formatUserProfile(updatedUser)
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
    const genericMessage =
      'If an account exists for that email, password reset instructions will be sent.';

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${frontendBase}/auth/reset-password?token=${resetToken}`;

    try {
      if (hasMailTransport()) {
        await sendPasswordResetEmail(user.email, resetUrl, user.firstName);
      } else if (process.env.NODE_ENV === 'development') {
        console.log('[dev] Password reset URL (no mail transport):', resetUrl);
      }
    } catch (err) {
      console.error('Failed to send password reset email:', err.message || err);
    }

    res.json({
      success: true,
      message: genericMessage
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
        passwordResetExpires: { [Op.gt]: new Date() }
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
      const secret = generateTwoFactorSecret(user.email);
      user.twoFactorSecret = secret.base32;
      user.twoFactorEnabled = true;

      await user.save();

      res.json({
        success: true,
        message: 'Two-factor authentication enabled',
        data: {
          otpauthUrl: secret.otpauth_url,
          secret: secret.base32,
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

    const isValidCode = verifyTotpCode(user.twoFactorSecret, code);
    
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

// @desc    Upload profile avatar
// @route   POST /api/auth/profile/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    const imageUrl = req.uploadedImageUrl;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] },
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

    if (user.avatarUrl && user.avatarUrl.includes('res.cloudinary.com')) {
      await deleteFromCloudinary(user.avatarUrl);
    }

    user.avatarUrl = imageUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        user: formatUserProfile(user)
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile image'
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
  googleAuth,
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
  updateProfileComprehensive,
  changePassword,
  toggleTwoFactorAuth,
  verifyTwoFactorCode,
  forgotPassword,
  resetPassword,
  logout,
  uploadAvatar
};
