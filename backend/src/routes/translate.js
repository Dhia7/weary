const express = require('express');
const { body, validationResult } = require('express-validator');
const { translateText } = require('../services/translateService');
const { translateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post(
  '/',
  translateLimiter,
  body('text').isString().trim().notEmpty().isLength({ max: 10_000 }),
  body('target').optional().isIn(['fr', 'en']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: errors.array(),
      });
    }

    const { text, target = 'fr' } = req.body;

    try {
      const translated = await translateText(text, target);
      return res.json({ success: true, data: { text: translated } });
    } catch (err) {
      console.error('Translation error:', err.message);
      return res.status(503).json({
        success: false,
        message: 'Translation temporarily unavailable',
      });
    }
  }
);

module.exports = router;
