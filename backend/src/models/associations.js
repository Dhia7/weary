const Product = require('./Product');
const Category = require('./Category');
const Collection = require('./Collection');
const ProductCategory = require('./ProductCategory');
const ProductCollection = require('./ProductCollection');
const User = require('./User');
const Cart = require('./Cart');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Wishlist = require('./Wishlist');

// User-Order associations (one-to-many)
User.hasMany(Order, { as: 'orders', foreignKey: 'userId' });
Order.belongsTo(User, { as: 'User', foreignKey: 'userId', allowNull: true });

// Order-OrderItem associations (one-to-many)
Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product-OrderItem associations (one-to-many)
Product.hasMany(OrderItem, { as: 'orderItems', foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Product-Category associations (many-to-many)
Product.belongsToMany(Category, { 
	through: ProductCategory, 
	foreignKey: 'productId', 
	otherKey: 'categoryId', 
	as: 'categories' 
});

Category.belongsToMany(Product, { 
	through: ProductCategory, 
	foreignKey: 'categoryId', 
	otherKey: 'productId', 
	as: 'products' 
});

// Product-Collection associations (many-to-many)
Product.belongsToMany(Collection, { 
	through: ProductCollection, 
	foreignKey: 'productId', 
	otherKey: 'collectionId', 
	as: 'collections' 
});

Collection.belongsToMany(Product, { 
	through: ProductCollection, 
	foreignKey: 'collectionId', 
	otherKey: 'productId', 
	as: 'products' 
});

// User-Cart associations (one-to-many)
User.hasMany(Cart, { as: 'cartItems', foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

// Product-Cart associations (one-to-many)
Product.hasMany(Cart, { as: 'cartItems', foreignKey: 'productId', onDelete: 'CASCADE' });
Cart.belongsTo(Product, { foreignKey: 'productId' });

// User-Wishlist associations (one-to-many)
User.hasMany(Wishlist, { as: 'wishlistItems', foreignKey: 'userId', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });

// Product-Wishlist associations (one-to-many)
Product.hasMany(Wishlist, { as: 'wishlistItems', foreignKey: 'productId', onDelete: 'CASCADE' });
Wishlist.belongsTo(Product, { foreignKey: 'productId' });

module.exports = {
	Product,
	Category,
	Collection,
	ProductCategory,
	ProductCollection,
	User,
	Cart,
	Order,
	OrderItem,
	Wishlist
};
