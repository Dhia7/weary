const express = require('express');
const router = express.Router();
const controller = require('../controllers/collectionController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', controller.listCollections);
router.get('/:idOrSlug', controller.getCollection);

// Admin protected routes
router.post('/', protect, admin, controller.createCollection);
router.put('/:id', protect, admin, controller.updateCollection);
router.delete('/:id', protect, admin, controller.deleteCollection);

// Product-collection relationship routes
router.post('/:collectionId/products/:productId', protect, admin, controller.addProductToCollection);
router.delete('/:collectionId/products/:productId', protect, admin, controller.removeProductFromCollection);

module.exports = router;
