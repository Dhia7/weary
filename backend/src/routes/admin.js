const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const categoryController = require('../controllers/categoryController');

// Admin routes - all require authentication and admin privileges
router.use(protect);
router.use(admin);

// User management
router.get('/users', adminController.getAllUsers);

// User search and filtering (must be before /users/:id route)
router.get('/users/search', adminController.searchUsers);

router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// User addresses
router.get('/users/:id/addresses', adminController.getUserAddresses);
router.post('/users/:id/addresses', adminController.addUserAddress);
router.put('/users/:id/addresses/:addressId', adminController.updateUserAddress);
router.delete('/users/:id/addresses/:addressId', adminController.deleteUserAddress);

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStats);

// Toggle admin status
router.put('/users/:id/admin', adminController.toggleUserAdmin);

// Orders management
router.get('/orders', orderController.listOrders);
router.get('/orders/:id', orderController.getOrderById);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.delete('/orders/:id', orderController.deleteOrder);

// Categories management
router.get('/categories', categoryController.listCategories);
router.get('/categories/:id', categoryController.getCategory);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

module.exports = router;






