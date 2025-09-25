const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// Get user's cart items
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'imageUrl', 'slug', 'SKU', 'quantity']
      }],
      order: [['createdAt', 'ASC']]
    });

    // Transform the data to match frontend expectations
    const transformedItems = cartItems.map(item => ({
      id: item.Product.id,
      name: item.Product.name,
      price: item.Product.price,
      image: item.Product.imageUrl,
      slug: item.Product.slug,
      quantity: item.quantity,
      stock: item.Product.quantity,
      SKU: item.Product.SKU
    }));

    res.json({
      success: true,
      data: { items: transformedItems }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Validate product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is out of stock
    if (product.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `${product.name} is currently out of stock`
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await Cart.findOne({
      where: { userId, productId }
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      
      // Check stock availability
      if (newQuantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.quantity} items available in stock for ${product.name}. You already have ${existingCartItem.quantity} in your cart.`
        });
      }

      await existingCartItem.update({ quantity: newQuantity });
    } else {
      // Check stock availability for new item
      if (quantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.quantity} items available in stock for ${product.name}`
        });
      }

      // Create new cart item
      await Cart.create({
        userId,
        productId,
        quantity
      });
    }

    // Return updated cart
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'imageUrl', 'slug', 'SKU', 'quantity']
      }],
      order: [['createdAt', 'ASC']]
    });

    const transformedItems = cartItems.map(item => ({
      id: item.Product.id,
      name: item.Product.name,
      price: item.Product.price,
      image: item.Product.imageUrl,
      slug: item.Product.slug,
      quantity: item.quantity,
      stock: item.Product.quantity,
      SKU: item.Product.SKU
    }));

    res.json({
      success: true,
      message: 'Item added to cart',
      data: { items: transformedItems }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    const cartItem = await Cart.findOne({
      where: { userId, productId },
      include: [{ model: Product }]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (quantity === 0) {
      // Remove item from cart
      await cartItem.destroy();
    } else {
      // Check if product is out of stock
      if (cartItem.Product.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `${cartItem.Product.name} is currently out of stock`
        });
      }

      // Check stock availability
      if (quantity > cartItem.Product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${cartItem.Product.quantity} items available in stock for ${cartItem.Product.name}`
        });
      }

      await cartItem.update({ quantity });
    }

    // Return updated cart
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'imageUrl', 'slug', 'SKU', 'quantity']
      }],
      order: [['createdAt', 'ASC']]
    });

    const transformedItems = cartItems.map(item => ({
      id: item.Product.id,
      name: item.Product.name,
      price: item.Product.price,
      image: item.Product.imageUrl,
      slug: item.Product.slug,
      quantity: item.quantity,
      stock: item.Product.quantity,
      SKU: item.Product.SKU
    }));

    res.json({
      success: true,
      message: 'Cart updated',
      data: { items: transformedItems }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const cartItem = await Cart.findOne({
      where: { userId, productId }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cartItem.destroy();

    // Return updated cart
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'imageUrl', 'slug', 'SKU', 'quantity']
      }],
      order: [['createdAt', 'ASC']]
    });

    const transformedItems = cartItems.map(item => ({
      id: item.Product.id,
      name: item.Product.name,
      price: item.Product.price,
      image: item.Product.imageUrl,
      slug: item.Product.slug,
      quantity: item.quantity,
      stock: item.Product.quantity,
      SKU: item.Product.SKU
    }));

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: { items: transformedItems }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Cart.destroy({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'Cart cleared',
      data: { items: [] }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Sync guest cart with user cart (merge items)
const syncCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { guestCartItems } = req.body;

    if (!Array.isArray(guestCartItems)) {
      return res.status(400).json({
        success: false,
        message: 'Guest cart items must be an array'
      });
    }

    // Process each guest cart item
    for (const guestItem of guestCartItems) {
      if (!guestItem.id || !guestItem.quantity) continue;

      // Check if product exists
      const product = await Product.findByPk(guestItem.id);
      if (!product) continue;

      // Skip out of stock items
      if (product.quantity <= 0) continue;

      // Check if item already exists in user's cart
      const existingCartItem = await Cart.findOne({
        where: { userId, productId: guestItem.id }
      });

      if (existingCartItem) {
        // Merge quantities, respecting stock limits
        const newQuantity = Math.min(
          existingCartItem.quantity + guestItem.quantity,
          product.quantity
        );
        await existingCartItem.update({ quantity: newQuantity });
      } else {
        // Add new item, respecting stock limits
        const quantity = Math.min(guestItem.quantity, product.quantity);
        if (quantity > 0) {
          await Cart.create({
            userId,
            productId: guestItem.id,
            quantity
          });
        }
      }
    }

    // Return updated cart
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'imageUrl', 'slug', 'SKU', 'quantity']
      }],
      order: [['createdAt', 'ASC']]
    });

    const transformedItems = cartItems.map(item => ({
      id: item.Product.id,
      name: item.Product.name,
      price: item.Product.price,
      image: item.Product.imageUrl,
      slug: item.Product.slug,
      quantity: item.quantity,
      stock: item.Product.quantity,
      SKU: item.Product.SKU
    }));

    res.json({
      success: true,
      message: 'Cart synchronized',
      data: { items: transformedItems }
    });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart
};
