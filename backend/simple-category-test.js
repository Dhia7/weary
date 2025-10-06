const express = require('express');
const { sequelize } = require('./src/config/database');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const ProductCategory = require('./src/models/ProductCategory');

const app = express();

app.get('/test-categories/:slug/products', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Getting products for category:', slug);
    
    // Find category
    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    console.log('Found category:', category.name);
    
    // Get products using raw query
    const products = await sequelize.query(`
      SELECT p.*
      FROM "Product" p
      INNER JOIN "ProductCategory" pc ON p.id = pc."productId"
      WHERE pc."categoryId" = :categoryId AND p."isActive" = true
      ORDER BY p."name" ASC
    `, {
      replacements: { categoryId: category.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('Found products:', products.length);
    
    res.json({
      success: true,
      data: {
        category,
        products,
        totalProducts: products.length
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});



