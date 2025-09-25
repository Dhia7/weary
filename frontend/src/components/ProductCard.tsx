'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import { getImageUrl } from '@/lib/utils';
import WishlistButton from './WishlistButton';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  SKU: string;
  weightGrams?: number;
  isActive: boolean;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  stockInfo?: {
    quantity?: number;
    status: string;
    isInStock: boolean;
    isLowStock?: boolean;
  };
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { showAddToCart } = useOrderNotification();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ 
      id: product.id.toString(), 
      name: product.name, 
      price: product.price,
      image: product.imageUrl || '/placeholder-product.jpg' 
    }, 1);
    showAddToCart(product.name);
  };


  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };

  // removed unused renderStars

  // Get appropriate emoji based on category
  const getCategoryEmoji = (categories?: Array<{name: string}>) => {
    if (!categories || categories.length === 0) return '👕';
    
    const categoryName = categories[0].name.toLowerCase();
    switch (categoryName) {
      case 'clothing':
        return '👗';
      case 'accessories':
        return '👜';
      case 'shoes':
        return '👠';
      default:
        return '👕';
    }
  };

  const getCategoryName = (categories?: Array<{name: string}>) => {
    if (!categories || categories.length === 0) return 'General';
    return categories[0].name;
  };

  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={getImageUrl(product.imageUrl) || ''}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
              <span className="text-6xl">{getCategoryEmoji(product.categories)}</span>
            </div>
          )}
          
          {/* Wishlist Button */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <WishlistButton 
              productId={product.id.toString()} 
              size="md" 
              variant="default"
            />
          </div>

          {/* Quick Add to Cart */}
          <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 transform transition-transform duration-300 ${
            isHovered ? 'translate-y-0' : 'translate-y-full'
          }`}>
            <button
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              className="w-full py-3 px-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBagIcon className="w-4 h-4 mr-2" />
              {product.quantity === 0 ? 'Out of Stock' : 'Quick Add'}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{getCategoryName(product.categories)}</p>
          
          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* SKU */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">SKU: {product.SKU}</p>

          {/* Price */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Stock Status */}
          {product.stockInfo && (
            <div className="mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                product.stockInfo.isLowStock
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : product.stockInfo.isInStock 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {product.stockInfo.status}
              </span>
            </div>
          )}

          {/* Description preview */}
          {product.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
