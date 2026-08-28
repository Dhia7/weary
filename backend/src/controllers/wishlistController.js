const { Wishlist, Product, ProductVariant } = require('../models/associations');
const { Op } = require('sequelize');
const { formatProductsForUser } = require('./productController');

const wishlistProductInclude = {
  model: Product,
  include: [{ model: ProductVariant, as: 'variants', required: false }],
  attributes: { exclude: ['sizeStock'] }
};

const formatWishlistItems = async (wishlistItems) => {
  const activeItems = (wishlistItems || []).filter((item) => item.Product && item.Product.isActive);
  const formattedProducts = await formatProductsForUser(
    activeItems.map((item) => item.Product),
    false
  );
  return activeItems.map((item, index) => {
    const json = item.toJSON ? item.toJSON() : item;
    return {
      ...json,
      Product: formattedProducts[index]
    };
  });
};

// Get user's wishlist
const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const wishlistItems = await Wishlist.findAll({
      where: { userId },
      include: [wishlistProductInclude],
      order: [['addedAt', 'DESC']]
    });

    const activeItems = await formatWishlistItems(wishlistItems);

    res.json({
      success: true,
      data: activeItems,
      count: activeItems.length
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    });
  }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, productSlug } = req.body;

    if (!productId && !productSlug) {
      return res.status(400).json({
        success: false,
        message: 'Provide productId or productSlug'
      });
    }

    // Resolve product by id or slug
    let resolvedProduct = null;
    if (productId) {
      const productIdInt = parseInt(productId, 10);
      if (isNaN(productIdInt)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' });
      }
      resolvedProduct = await Product.findByPk(productIdInt);
    } else {
      resolvedProduct = await Product.findOne({ where: { slug: productSlug } });
    }

    if (!resolvedProduct || !resolvedProduct.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or inactive' });
    }

    // Check if item is already in wishlist
    const existingItem = await Wishlist.findOne({
      where: { userId, productId: resolvedProduct.id }
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist'
      });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      userId,
      productId: resolvedProduct.id,
      addedAt: new Date()
    });

    // Fetch the created item with product details
    const newItem = await Wishlist.findByPk(wishlistItem.id, {
      include: [wishlistProductInclude]
    });

    const [formatted] = await formatWishlistItems(newItem ? [newItem] : []);

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      data: formatted || newItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist'
    });
  }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params; // may be numeric id or slug

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID or slug is required' });
    }

    let productIdInt = parseInt(productId, 10);
    if (isNaN(productIdInt)) {
      const product = await Product.findOne({ where: { slug: productId } });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      productIdInt = product.id;
    }

    // Find and delete the wishlist item
    const deletedItem = await Wishlist.destroy({
      where: { userId, productId: productIdInt }
    });

    if (deletedItem === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist'
    });
  }
};

// Check if product is in wishlist
const checkWishlistStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params; // may be numeric id or slug

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID or slug is required' });
    }

    let productIdInt = parseInt(productId, 10);
    if (isNaN(productIdInt)) {
      const product = await Product.findOne({ where: { slug: productId } });
      if (!product) {
        return res.json({ success: true, data: { isInWishlist: false, addedAt: null } });
      }
      productIdInt = product.id;
    }

    const wishlistItem = await Wishlist.findOne({
      where: { userId, productId: productIdInt }
    });

    res.json({
      success: true,
      data: {
        isInWishlist: !!wishlistItem,
        addedAt: wishlistItem?.addedAt || null
      }
    });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status'
    });
  }
};

// Clear entire wishlist
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const deletedCount = await Wishlist.destroy({
      where: { userId }
    });

    res.json({
      success: true,
      message: `Cleared ${deletedCount} items from wishlist`
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist'
    });
  }
};

module.exports = {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  clearWishlist
};
