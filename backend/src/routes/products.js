const express = require('express');
const router = express.Router();
const { protect, admin, optionalAuth } = require('../middleware/auth');
const controller = require('../controllers/productController');

// Public listings
router.get('/', optionalAuth, controller.listProducts);
router.get('/:idOrSlug', optionalAuth, controller.getProduct);

// Admin protected mutations
router.post('/', protect, admin, controller.createProduct);
router.put('/:id', protect, admin, controller.updateProduct);
router.delete('/:id', protect, admin, controller.deleteProduct);
router.put('/:id/categories', protect, admin, controller.setProductCategories);

module.exports = router;


