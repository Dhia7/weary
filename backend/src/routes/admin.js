const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');

// Admin routes - all require authentication and admin privileges
router.use(protect);

// Special route to request admin privileges (bypasses admin middleware)
router.put('/users/:id/request-admin', adminController.requestAdminPrivileges);

// All other admin routes require admin privileges
router.use(admin);

// Admin management
router.get('/admins', adminController.listAdmins);

// User management
router.get('/users', adminController.getAllUsers);
// Set admin must be before :id to avoid shadowing
router.put('/users/:id/admin', adminController.setUserAdmin);
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

// User search and filtering
router.get('/users/search', adminController.searchUsers);

// Order management
router.get('/orders', orderController.listOrders);
router.get('/orders/:id', orderController.getOrderById);
router.post('/orders', orderController.createOrder);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.delete('/orders/:id', orderController.deleteOrder);

module.exports = router;




