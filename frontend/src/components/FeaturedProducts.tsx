'use client';

import ProductCard from './ProductCard';

// Mock data for featured products
const featuredProducts = [
  {
    id: '1',
    name: 'Elegant Summer Dress',
    price: 89.99,
    originalPrice: 129.99,
    image: '/product1.jpg',
    designer: 'Elena Designs',
    category: 'Women',
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: '2',
    name: 'Classic Denim Jacket',
    price: 75.00,
    image: '/product2.jpg',
    designer: 'Urban Threads',
    category: 'Men',
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: '3',
    name: 'Silk Blouse Collection',
    price: 65.50,
    image: '/product3.jpg',
    designer: 'Sophia Fashion',
    category: 'Women',
    rating: 4.9,
    reviewCount: 156,
  },
  {
    id: '4',
    name: 'Leather Crossbody Bag',
    price: 120.00,
    image: '/product4.jpg',
    designer: 'Luxe Accessories',
    category: 'Accessories',
    rating: 4.7,
    reviewCount: 203,
  },
  {
    id: '5',
    name: 'Minimalist Watch',
    price: 199.99,
    image: '/product5.jpg',
    designer: 'TimeCraft',
    category: 'Accessories',
    rating: 4.5,
    reviewCount: 67,
  },
  {
    id: '6',
    name: 'Casual Sneakers',
    price: 85.00,
    originalPrice: 110.00,
    image: '/product6.jpg',
    designer: 'Comfort Steps',
    category: 'Footwear',
    rating: 4.4,
    reviewCount: 98,
  },
  {
    id: '7',
    name: 'Statement Necklace',
    price: 45.99,
    image: '/product7.jpg',
    designer: 'Jewel Box',
    category: 'Jewelry',
    rating: 4.6,
    reviewCount: 134,
  },
  {
    id: '8',
    name: 'Premium Cotton T-Shirt',
    price: 35.00,
    image: '/product8.jpg',
    designer: 'Basic Essentials',
    category: 'Men',
    rating: 4.3,
    reviewCount: 245,
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover the latest trends and unique pieces from our curated collection of independent designers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
