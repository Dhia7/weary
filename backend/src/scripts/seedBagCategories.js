/*
  Seed bag categories and assign existing products.
  Safe to re-run: upserts categories, replaces product↔category links.
*/

require('dotenv').config();

const { sequelize } = require('../config/database');
require('../models/associations');

const Category = require('../models/Category');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

const BAG_CATEGORIES = [
  {
    name: 'Totes',
    slug: 'totes',
    description: 'Everyday tote bags — from canvas to leather',
  },
  {
    name: 'Handbags',
    slug: 'handbags',
    description: 'Top-handle and structured handbags',
  },
  {
    name: 'Crossbody bags',
    slug: 'crossbody-bags',
    description: 'Bags with a crossbody strap for hands-free wear',
  },
  {
    name: 'Clutches',
    slug: 'clutches',
    description: 'Evening and compact clutch bags',
  },
  {
    name: 'Travel bags',
    slug: 'travel-bags',
    description: 'Weekenders and travel-ready bags',
  },
];

const LEGACY_SLUGS = ['women', 'men', 'accessories', 'footwear', 'jewelry', 'activewear'];

/** Assign bag category slugs from product name/slug. */
function inferBagCategorySlugs(product) {
  const text = `${product.name} ${product.slug}`.toLowerCase();
  const slugs = new Set();

  if (/\btote\b/.test(text)) slugs.add('totes');
  if (/\bcrossbody\b/.test(text)) slugs.add('crossbody-bags');
  if (/\b(clutch|pouch)\b/.test(text) && !/\btote\b/.test(text) && !/\btop.?handle\b/.test(text)) {
    slugs.add('clutches');
  }
  if (/\b(travel|weekender|duffel|cabin)\b/.test(text)) slugs.add('travel-bags');
  if (/\b(handbag|top.?handle|half-?moon)\b/.test(text)) slugs.add('handbags');

  // Structured bags without tote/crossbody wording → handbags
  if (slugs.size === 0) slugs.add('handbags');

  return [...slugs];
}

async function seedBagCategories() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    console.log('Database connected.\n');

    const slugToId = {};

    console.log('Upserting bag categories...');
    for (const data of BAG_CATEGORIES) {
      const [category, created] = await Category.findOrCreate({
        where: { slug: data.slug },
        defaults: { ...data, isActive: true },
      });

      if (!created) {
        await category.update({
          name: data.name,
          description: data.description,
          isActive: true,
        });
        console.log(`  Updated: ${category.name} (${category.slug})`);
      } else {
        console.log(`  Created: ${category.name} (${category.slug})`);
      }

      slugToId[category.slug] = category.id;
    }

    console.log('\nDeactivating legacy clothing categories...');
    const [deactivated] = await Category.update(
      { isActive: false },
      { where: { slug: LEGACY_SLUGS } }
    );
    console.log(`  Deactivated: ${deactivated}`);

    const products = await Product.findAll({
      attributes: ['id', 'name', 'slug'],
      order: [['id', 'ASC']],
    });

    console.log(`\nAssigning ${products.length} products to bag categories...`);
    for (const product of products) {
      const inferred = inferBagCategorySlugs(product);
      const categoryIds = inferred.map((slug) => slugToId[slug]).filter(Boolean);

      await ProductCategory.destroy({ where: { productId: product.id } });
      for (const categoryId of categoryIds) {
        await ProductCategory.create({ productId: product.id, categoryId });
      }

      console.log(`  #${product.id} ${product.name}`);
      console.log(`     → ${inferred.join(', ')}`);
    }

    console.log('\nDone.');
    const active = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
    console.log('\nActive categories:');
    active.forEach((c) => console.log(`  - ${c.name} (/${c.slug})`));

    process.exit(0);
  } catch (err) {
    console.error('Bag category seed failed:', err);
    process.exit(1);
  }
}

seedBagCategories();
