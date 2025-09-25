const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(protect);

// GET /api/cart - Get user's cart items
router.get('/', getCart);

// POST /api/cart - Add item to cart
router.post('/', addToCart);

// PUT /api/cart - Update cart item quantity
router.put('/', updateCartItem);

// DELETE /api/cart/:productId - Remove item from cart
router.delete('/:productId', removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete('/', clearCart);

// POST /api/cart/sync - Sync guest cart with user cart
router.post('/sync', syncCart);

module.exports = router;





