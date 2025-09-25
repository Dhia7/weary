const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('preferences.sizePreference')
    .optional()
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Invalid size preference'),
  body('preferences.favoriteCategories')
    .optional()
    .isArray()
    .withMessage('Favorite categories must be an array'),
  body('preferences.favoriteCategories.*')
    .optional()
    .isIn(['men', 'women', 'kids', 'accessories', 'shoes'])
    .withMessage('Invalid category')
];

const updateProfileComprehensiveValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('preferences.sizePreference')
    .optional()
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Invalid size preference'),
  body('preferences.favoriteCategories')
    .optional()
    .isArray()
    .withMessage('Favorite categories must be an array'),
  body('preferences.favoriteCategories.*')
    .optional()
    .isIn(['men', 'women', 'kids', 'accessories', 'shoes'])
    .withMessage('Invalid category'),
  body('addresses')
    .optional()
    .isArray()
    .withMessage('Addresses must be an array'),
  body('addresses.*.type')
    .optional()
    .isIn(['home', 'work', 'other'])
    .withMessage('Invalid address type'),
  body('addresses.*.street')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Street address is required'),
  body('addresses.*.city')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('City is required'),
  body('addresses.*.state')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('State is required'),
  body('addresses.*.zipCode')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Zip code is required'),
  body('addresses.*.country')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Country is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
];

const toggleTwoFactorValidation = [
  body('enable')
    .isBoolean()
    .withMessage('Enable must be a boolean value'),
  body('password')
    .notEmpty()
    .withMessage('Password is required to enable/disable 2FA')
];

const verifyTwoFactorValidation = [
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Two-factor code must be 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('Two-factor code must contain only numbers')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, updateProfileValidation, authController.updateProfile);
router.put('/profile/update', protect, updateProfileComprehensiveValidation, authController.updateProfileComprehensive);
router.put('/change-password', protect, changePasswordValidation, authController.changePassword);
router.put('/2fa', protect, toggleTwoFactorValidation, authController.toggleTwoFactorAuth);
router.post('/2fa/verify', protect, verifyTwoFactorValidation, authController.verifyTwoFactorCode);
router.post('/logout', protect, authController.logout);

// Admin privilege request (accessible to authenticated users)
router.put('/users/:id/request-admin', protect, authController.requestAdminPrivileges);

module.exports = router;

