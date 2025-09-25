const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  clearWishlist
} = require('../controllers/wishlistController');

// All routes require authentication
router.use(protect);

// GET /api/wishlist - Get user's wishlist
router.get('/', getUserWishlist);

// POST /api/wishlist - Add item to wishlist
router.post('/', addToWishlist);

// DELETE /api/wishlist/:productId - Remove item from wishlist
router.delete('/:productId', removeFromWishlist);

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', checkWishlistStatus);

// DELETE /api/wishlist - Clear entire wishlist
router.delete('/', clearWishlist);

module.exports = router;
