const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, admin, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, categoryController.listCategories);
router.get('/:idOrSlug', optionalAuth, categoryController.getCategory);
router.get('/:idOrSlug/products', optionalAuth, categoryController.getCategoryProducts);

// Admin protected routes
router.post('/', protect, admin, categoryController.createCategory);
router.put('/:id', protect, admin, categoryController.updateCategory);
router.delete('/:id', protect, admin, categoryController.deleteCategory);

module.exports = router;




