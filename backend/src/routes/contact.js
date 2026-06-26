const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimit');
const contactController = require('../controllers/contactController');

const contactValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be at most 255 characters'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject must be at most 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message must be at most 5000 characters'),
];

router.post(
  '/',
  contactLimiter,
  optionalAuth,
  contactValidation,
  contactController.submitContactMessage
);

module.exports = router;
