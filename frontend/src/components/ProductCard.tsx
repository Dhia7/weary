'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import { getImageUrl } from '@/lib/utils';
import WishlistButton from './WishlistButton';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import QuickViewModal from './QuickViewModal';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  SKU: string;
  weightGrams?: number;
  isActive: boolean;
  imageUrl?: string;
  images?: string[];
  mainThumbnailIndex?: number;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  size?: string | null;
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

const ProductCard = memo(({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { addItem } = useCart();
  const { showAddToCart } = useOrderNotification();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If product has sizes, require size selection via quick view modal
    if (product.size && product.size.trim().length > 0) {
      setIsQuickViewOpen(true);
      return;
    }
    
    // For products without sizes, add directly to cart
    try {
      await addItem({ 
        id: product.id.toString(), 
        name: product.name, 
        price: product.price,
        image: product.imageUrl || '/placeholder-product.jpg',
        slug: product.slug
      }, 1);
      // Show success notification every time an item is added
      showAddToCart(product.name);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      // Error handling is done by CartContext
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
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
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
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

          {/* Quick Actions */}
          <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 transform transition-transform duration-300 ${
            isHovered ? 'translate-y-0' : 'translate-y-full'
          }`}>
            <div className="flex border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleQuickView}
                className="flex-1 py-3 px-4 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-200 dark:border-gray-700"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Quick View
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!(product.stockInfo?.isInStock ?? (product.quantity ?? 0) > 0)}
                className="flex-1 py-3 px-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBagIcon className="w-4 h-4 mr-2" />
                {(product.stockInfo?.isInStock ?? (product.quantity ?? 0) > 0) 
                  ? (product.size && product.size.trim().length > 0 ? 'Select Size' : 'Add to Cart')
                  : 'Out of Stock'}
              </button>
            </div>
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
          {(() => {
            // Show status text, not exact quantity (for regular users)
            const isInStock = product.stockInfo?.isInStock ?? (product.quantity ?? 0) > 0;
            const isLowStock = product.stockInfo?.isLowStock ?? ((product.quantity ?? 0) > 0 && (product.quantity ?? 0) <= 10);
            const status = product.stockInfo?.status ?? (isInStock ? (isLowStock ? 'Low Stock' : 'In Stock') : 'Out of Stock');
            
            if (product.stockInfo || product.quantity !== undefined) {
              return (
                <div className="mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isLowStock
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : isInStock 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {status}
                  </span>
                </div>
              );
            }
            return null;
          })()}

          {/* Description preview */}
          {product.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </Link>

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        product={product}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.imageUrl === nextProps.product.imageUrl &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.quantity === nextProps.product.quantity &&
    prevProps.product.compareAtPrice === nextProps.product.compareAtPrice &&
    prevProps.product.stockInfo?.status === nextProps.product.stockInfo?.status
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
