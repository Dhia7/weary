const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { Op } = require('sequelize');

// Helper function to transform cart items with unique IDs
const transformCartItems = (cartItems) => {
  try {
    if (!Array.isArray(cartItems)) {
      console.error('transformCartItems: cartItems is not an array:', typeof cartItems);
      return [];
    }
    
    return cartItems
      .filter(item => {
        if (!item) return false;
        const itemData = item.toJSON ? item.toJSON() : item;
        const hasProduct = itemData.Product !== null && itemData.Product !== undefined;
        if (!hasProduct) {
          console.warn('Cart item has no Product association:', { 
            cartItemId: itemData.id, 
            productId: itemData.productId 
          });
        }
        return hasProduct;
      })
      .map(item => {
        try {
          const itemData = item.toJSON ? item.toJSON() : item;
          const product = itemData.Product;
          
          if (!product || !product.id) {
            console.warn('Cart item has invalid Product:', { 
              cartItemId: itemData.id,
              product: product 
            });
            return null;
          }
          
          // Use cart item ID as unique identifier (allows same product with different sizes)
          // Fallback to productId-size combination if cart item ID not available
          const uniqueId = itemData.id 
            ? `${itemData.id}` 
            : `${product.id}-${itemData.size || 'no-size'}`;
          
          const transformed = {
            id: uniqueId, // Unique cart item identifier
            productId: String(product.id), // Product ID for reference (ensure string)
            name: product.name || 'Unknown Product',
            price: Number(product.price) || 0,
            image: product.imageUrl || null,
            slug: product.slug || null,
            quantity: Number(itemData.quantity) || 1,
            stock: Number(product.quantity) || 0,
            SKU: product.SKU || '',
            size: itemData.size || undefined,
            cartItemId: itemData.id ? String(itemData.id) : undefined // Keep original cart item ID for backend operations
          };
          
          return transformed;
        } catch (itemError) {
          console.error('Error transforming individual cart item:', itemError);
          console.error('Item data:', item);
          return null;
        }
      })
      .filter(item => item !== null); // Remove any null items
  } catch (error) {
    console.error('Error in transformCartItems:', error);
    console.error('Error stack:', error.stack);
    return [];
  }
};

// Get user's cart items
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: { exclude: ['sizeStock'] }
      }],
      order: [['createdAt', 'ASC']]
    });

    // Transform the data to match frontend expectations
    const transformedItems = transformCartItems(cartItems);

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
    const { productId, quantity = 1, size: rawSize } = req.body;
    
    // Normalize size: convert empty string to null
    const size = rawSize && rawSize.trim() ? rawSize.trim() : null;
    
    console.log('Add to cart request:', { userId, productId, quantity, size });

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Validate product exists
    const product = await Product.findByPk(productId, {
      attributes: { exclude: ['sizeStock'] }
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // If product has sizes, size is required
    if (product.size && product.size.trim().length > 0 && !size) {
      return res.status(400).json({
        success: false,
        message: 'Size is required for this product'
      });
    }

    // Check if item already exists in cart (same product + same size)
    // Handle missing size column gracefully
    let existingCartItem;
    try {
      // First, check all cart items for this user and product (for debugging)
      const allUserProductItems = await Cart.findAll({
        where: { userId, productId },
        attributes: ['id', 'quantity', 'size', 'productId']
      });
      console.log(`Found ${allUserProductItems.length} existing cart items for user ${userId}, product ${productId}:`, 
        allUserProductItems.map(i => ({ id: i.id, size: i.size, quantity: i.quantity })));
      
      let whereClause;
      if (size) {
        // Product with size - find exact match
        whereClause = { userId, productId, size: size };
      } else {
        // Product without size - find where size is NULL
        // Use Op.is for explicit NULL comparison
        whereClause = { 
          userId, 
          productId,
          size: { [Op.is]: null }
        };
      }
      
      console.log('Checking for existing cart item:', whereClause);
      existingCartItem = await Cart.findOne({
        where: whereClause
      });
      console.log('Existing cart item found:', existingCartItem ? `Yes (ID: ${existingCartItem.id}, Size: ${existingCartItem.size})` : 'No');
    } catch (error) {
      console.error('Error finding existing cart item:', error);
      console.error('Query error details:', {
        message: error.message,
        userId,
        productId,
        size,
        code: error.parent?.code,
        sql: error.sql
      });
      // If size column doesn't exist, fall back to query without size
      if (error.message && (error.message.includes('column') || error.message.includes('does not exist')) && error.message.includes('size')) {
        console.warn('Size column not found, using fallback query');
        existingCartItem = await Cart.findOne({
          where: { userId, productId }
        });
      } else {
        throw error;
      }
    }

    if (existingCartItem) {
      // Update quantity - automatically sum with existing quantity
      const newQuantity = existingCartItem.quantity + quantity;
      try {
        await existingCartItem.update({ quantity: newQuantity });
      } catch (error) {
        // If size column doesn't exist, update without size
        if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
          await existingCartItem.update({ quantity: newQuantity }, { fields: ['quantity'] });
        } else {
          throw error;
        }
      }
    } else {
      // Create new cart item with selected size
      console.log('Creating new cart item:', { userId, productId, quantity, size });
      try {
        const newCartItem = await Cart.create({
          userId,
          productId,
          quantity,
          size: size || null
        });
        console.log('Cart item created successfully:', newCartItem.id);
      } catch (error) {
        console.error('Cart.create error:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          code: error.parent?.code,
          constraint: error.parent?.constraint,
          detail: error.parent?.detail,
          sql: error.sql
        });
        
        // If size column doesn't exist, create without size
        if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
          console.warn('Size column not found, creating without size');
          await Cart.create({
            userId,
            productId,
            quantity
          });
        } else if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
          // Unique constraint violation - item already exists, update it instead
          console.warn('Unique constraint violation, trying to find and update existing item');
          let whereClause;
          if (size) {
            whereClause = { userId, productId, size: size };
          } else {
            whereClause = { 
              userId, 
              productId,
              size: { [Op.is]: null }
            };
          }
          existingCartItem = await Cart.findOne({ where: whereClause });
          if (existingCartItem) {
            console.log('Found existing item, updating quantity');
            // Update quantity instead
            const newQuantity = existingCartItem.quantity + quantity;
            await existingCartItem.update({ quantity: newQuantity });
          } else {
            console.error('Unique constraint error but item not found - this should not happen');
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    // Return updated cart
    try {
      const cartItems = await Cart.findAll({
        where: { userId },
        include: [{
          model: Product,
          attributes: { exclude: ['sizeStock'] },
          required: false // Use LEFT JOIN in case product is deleted
        }],
        order: [['createdAt', 'ASC']]
      });

      console.log('Cart items fetched:', cartItems.length);
      const transformedItems = transformCartItems(cartItems);
      console.log('Transformed items:', transformedItems.length);

      res.json({
        success: true,
        message: 'Item added to cart',
        data: { items: transformedItems }
      });
    } catch (transformError) {
      console.error('Error transforming cart items:', transformError);
      console.error('Transform error details:', {
        message: transformError.message,
        stack: transformError.stack,
        name: transformError.name
      });
      // Return error instead of empty items
      throw transformError;
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.parent?.code,
      constraint: error.parent?.constraint,
      detail: error.parent?.detail,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity, size } = req.body;

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

    // Find cart item by productId and size
    let cartItem;
    try {
      const whereClause = { userId, productId };
      if (size) {
        whereClause.size = size;
      } else {
        whereClause.size = null;
      }

      cartItem = await Cart.findOne({
        where: whereClause,
        include: [{ model: Product, attributes: { exclude: ['sizeStock'] } }]
      });
    } catch (error) {
      // If size column doesn't exist, fall back to query without size
      if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
        cartItem = await Cart.findOne({
          where: { userId, productId },
          include: [{ model: Product, attributes: { exclude: ['sizeStock'] } }]
        });
      } else {
        throw error;
      }
    }

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
      // Update quantity without stock restrictions
      try {
        await cartItem.update({ quantity });
      } catch (error) {
        // If size column doesn't exist, update without size
        if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
          await cartItem.update({ quantity }, { fields: ['quantity'] });
        } else {
          throw error;
        }
      }
    }

    // Return updated cart
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: { exclude: ['sizeStock'] }
      }],
      order: [['createdAt', 'ASC']]
    });

    const transformedItems = transformCartItems(cartItems);

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
    const { size } = req.query; // Size can be passed as query param

    let cartItem;
    try {
      const whereClause = { userId, productId };
      if (size) {
        whereClause.size = size;
      } else {
        whereClause.size = null;
      }

      cartItem = await Cart.findOne({
        where: whereClause
      });
    } catch (error) {
      // If size column doesn't exist, fall back to query without size
      if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
        cartItem = await Cart.findOne({
          where: { userId, productId }
        });
      } else {
        throw error;
      }
    }

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
        attributes: { exclude: ['sizeStock'] }
      }],
      order: [['createdAt', 'ASC']]
    });

    const transformedItems = transformCartItems(cartItems);

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

      // Check if item already exists in user's cart (same product + same size)
      let existingCartItem;
      try {
        const whereClause = { userId, productId: guestItem.id };
        if (guestItem.size) {
          whereClause.size = guestItem.size;
        } else {
          whereClause.size = null;
        }

        existingCartItem = await Cart.findOne({
          where: whereClause
        });
      } catch (error) {
        // If size column doesn't exist, fall back to query without size
        if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
          existingCartItem = await Cart.findOne({
            where: { userId, productId: guestItem.id }
          });
        } else {
          throw error;
        }
      }

      if (existingCartItem) {
        // Merge quantities without stock restrictions
        const newQuantity = existingCartItem.quantity + guestItem.quantity;
        try {
          await existingCartItem.update({ quantity: newQuantity });
        } catch (error) {
          // If size column doesn't exist, update without size
          if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
            await existingCartItem.update({ quantity: newQuantity }, { fields: ['quantity'] });
          } else {
            throw error;
          }
        }
      } else {
        // Add new item with size (if provided)
        try {
          await Cart.create({
            userId,
            productId: guestItem.id,
            quantity: guestItem.quantity,
            size: guestItem.size || null
          });
        } catch (error) {
          // If size column doesn't exist, create without size
          if (error.message && error.message.includes('column') && error.message.includes('size') && error.message.includes('does not exist')) {
            await Cart.create({
              userId,
              productId: guestItem.id,
              quantity: guestItem.quantity
            });
          } else {
            throw error;
          }
        }
      }
    }

    // Return updated cart
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: { exclude: ['sizeStock'] }
      }],
      order: [['createdAt', 'ASC']]
    });

    const transformedItems = transformCartItems(cartItems);

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
