'use client';

import { useState } from 'react';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { useCart } from '@/lib/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Eye, 
  DollarSign,
  Package,
  X
} from 'lucide-react';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import type { CartItem } from '@/lib/contexts/CartContext';

interface WishlistTabProps {
  className?: string;
}

export default function WishlistTab({ className = '' }: WishlistTabProps) {
  const { 
    wishlistItems, 
    isLoading, 
    error, 
    removeFromWishlist, 
    clearWishlist,
    wishlistCount 
  } = useWishlist();
  
  const { addItem } = useCart();
  const { showAddToCart } = useOrderNotification();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

  const handleRemoveFromWishlist = async (productId: string) => {
    setRemovingItems(prev => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId);
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(prev => new Set(prev).add(productId));
    try {
      const wishlistEntry = wishlistItems.find(w => String(w.Product.id) === String(productId));
      const product = wishlistEntry?.Product as {
        id: string | number;
        name: string;
        slug: string;
        price: number;
        compareAtPrice?: number;
        imageUrl?: string;
        images?: string[];
        mainThumbnailIndex?: number;
      } | undefined;
      if (product) {
        const image = (product.images && product.images.length > 0)
          ? product.images[product.mainThumbnailIndex || 0]
          : (product.imageUrl || '/placeholder-product.jpg');
        const cartItem: Omit<CartItem, 'quantity'> = {
          id: String(product.id),
          name: product.name,
          price: product.price,
          image,
          slug: product.slug,
        };
        await addItem(cartItem, 1);
        showAddToCart(product.name);
      }
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearWishlist = async () => {
    if (confirm('Are you sure you want to clear your entire wishlist? This action cannot be undone.')) {
      await clearWishlist();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getProductImage = (product: {
    images?: string[];
    mainThumbnailIndex?: number;
    imageUrl?: string;
  }) => {
    if (product.images && product.images.length > 0) {
      const mainIndex = product.mainThumbnailIndex || 0;
      return product.images[mainIndex];
    }
    return product.imageUrl || '/placeholder-product.jpg';
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <X className="w-12 h-12 mx-auto mb-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (wishlistCount === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Save items you love for later by clicking the heart icon on any product.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            My Wishlist
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        {wishlistCount > 0 && (
          <button
            onClick={handleClearWishlist}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <AnimatePresence>
          {wishlistItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                <Link href={`/product/${item.Product.slug}`}>
                  <Image
                    src={getProductImage(item.Product)}
                    alt={item.Product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                
                {/* Wishlist Button */}
                <button
                  onClick={() => handleRemoveFromWishlist(item.Product.id)}
                  disabled={removingItems.has(item.Product.id)}
                  className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                >
                  {removingItems.has(item.Product.id) ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4 fill-red-500 text-red-500 group-hover:fill-red-600 group-hover:text-red-600" />
                  )}
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/product/${item.Product.slug}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {item.Product.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="flex items-center space-x-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(item.Product.price)}
                  </span>
                  {item.Product.compareAtPrice && item.Product.compareAtPrice > item.Product.price && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(item.Product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${
                    item.Product.quantity > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`text-xs ${
                    item.Product.quantity > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {item.Product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 flex-nowrap">
                  <Link
                    href={`/product/${item.Product.slug}`}
                    className="flex items-center justify-center space-x-2 px-3 py-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="whitespace-nowrap">View</span>
                  </Link>
                  
                  <button
                    onClick={() => handleAddToCart(item.Product.id)}
                    disabled={item.Product.quantity === 0 || addingToCart.has(item.Product.id)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      item.Product.quantity === 0
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : addingToCart.has(item.Product.id)
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {addingToCart.has(item.Product.id) ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    <span className="whitespace-nowrap">
                      {item.Product.quantity === 0 
                        ? 'Out of Stock' 
                        : addingToCart.has(item.Product.id) 
                        ? 'Adding...' 
                        : 'Add to Cart'
                      }
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}





