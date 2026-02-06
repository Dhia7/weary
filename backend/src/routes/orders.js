const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// User orders routes - require authentication
router.get('/', protect, orderController.getUserOrders);
router.get('/:id', protect, orderController.getUserOrderById);

module.exports = router;
