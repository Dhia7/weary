const { body } = require('express-validator');

/** Optional +, then 8–15 digits. Spaces and separators are removed before this check. */
const STORED_PHONE_PATTERN = /^\+?[0-9]{8,15}$/;

/**
 * Blank becomes null. Spaces, dashes, dots, and parentheses are removed.
 * A 00 international prefix is stored as +.
 */
function normalizeStoredPhone(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  let compact = raw.replace(/[\s().-]/g, '');
  if (compact.startsWith('00')) {
    compact = `+${compact.slice(2)}`;
  }
  return compact;
}

function isValidStoredPhone(value) {
  return typeof value === 'string' && STORED_PHONE_PATTERN.test(value);
}

/** Accepts a missing, blank, or human-formatted phone and stores the compact form. */
const validateOptionalPhone = body('phone').custom((value, { req }) => {
  if (value === undefined) return true;
  const normalized = normalizeStoredPhone(value);
  if (normalized == null) {
    req.body.phone = null;
    return true;
  }
  if (!isValidStoredPhone(normalized)) {
    throw new Error('Please enter a valid phone number');
  }
  req.body.phone = normalized;
  return true;
});

module.exports = {
  STORED_PHONE_PATTERN,
  normalizeStoredPhone,
  isValidStoredPhone,
  validateOptionalPhone,
};
