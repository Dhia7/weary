'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  designer: string;
  category: string;
  rating: number;
  reviewCount: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement add to cart functionality
    console.log('Added to cart:', product.id);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
    console.log('Wishlist toggled:', product.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-4 h-4 ${
            i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  // Get appropriate emoji based on category
  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case 'women':
        return '👗';
      case 'men':
        return '👔';
      case 'accessories':
        return '👜';
      case 'footwear':
        return '👠';
      case 'jewelry':
        return '💍';
      default:
        return '👕';
    }
  };

  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.id}`} className="block">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
            <span className="text-6xl">{getCategoryEmoji(product.category)}</span>
          </div>
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
          >
            {isWishlisted ? (
              <HeartIconSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Quick Add to Cart */}
          <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 transform transition-transform duration-300 ${
            isHovered ? 'translate-y-0' : 'translate-y-full'
          }`}>
            <button
              onClick={handleAddToCart}
              className="w-full py-3 px-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
            >
              <ShoppingBagIcon className="w-4 h-4 mr-2" />
              Quick Add
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Designer */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{product.designer}</p>
          
          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex">
              {renderStars(product.rating)}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({product.reviewCount})
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
