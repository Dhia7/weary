const express = require('express');
const router = express.Router();
const { protect, admin, optionalAuth } = require('../middleware/auth');
const controller = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const categoryController = require('../controllers/categoryController');
const { uploadMultipleImages } = require('../middleware/upload');

// Public listings
router.get('/', optionalAuth, controller.listProducts);
router.get('/categories', categoryController.listCategories);
router.get('/:idOrSlug', optionalAuth, controller.getProduct);

// Admin protected mutations
router.post('/', protect, admin, uploadMultipleImages, controller.createProduct);
router.put('/:id', protect, admin, uploadMultipleImages, controller.updateProduct);
router.delete('/:id', protect, admin, controller.deleteProduct);
router.put('/:id/categories', protect, admin, controller.setProductCategories);

// Customer checkout - Cash on Delivery (authenticated users)
router.post('/checkout/cod', protect, (req, res) => {
  // Enforce COD
  req.body.paymentMethod = 'cash_on_delivery';
  return orderController.createUserOrder(req, res);
});

// Guest checkout - Cash on Delivery (no authentication required)
router.post('/checkout/guest', (req, res) => {
  // Enforce COD for guest orders
  req.body.paymentMethod = 'cash_on_delivery';
  return orderController.createGuestOrder(req, res);
});

// Personalized t-shirt order - accepts image upload
router.post('/personalized-tshirt-order', optionalAuth, uploadMultipleImages, orderController.createPersonalizedTShirtOrder);

module.exports = router;





