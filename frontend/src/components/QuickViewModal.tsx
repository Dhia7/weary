'use client';

import { useEffect, useState, useCallback } from 'react';
import { XMarkIcon, ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import { getImageUrl } from '@/lib/utils';
import WishlistButton from './WishlistButton';

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

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const QuickViewModal = ({ isOpen, onClose, product }: QuickViewModalProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { showAddToCart } = useOrderNotification();

  // Reset state when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setSelectedImageIndex(0);
      setQuantity(1);
      setSelectedSize('');
      setSizeError(null);
    }
  }, [isOpen, product]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Get ordered images (main thumbnail first)
  const getOrderedImages = useCallback((p?: Product | null) => {
    if (!p || !p.images || p.images.length === 0) {
      return p?.imageUrl ? [p.imageUrl] : [];
    }
    const images = p.images;
    const mainIndex = typeof p.mainThumbnailIndex === 'number' ? p.mainThumbnailIndex : 0;
    const clampedIndex = Math.max(0, Math.min(mainIndex, images.length - 1));
    if (clampedIndex === 0) return images;
    const main = images[clampedIndex];
    return [main, ...images.filter((_, i) => i !== clampedIndex)];
  }, []);

  const handleAddToCart = async () => {
    if (product) {
      // Validate size selection if product has sizes
      if (product.size && product.size.trim().length > 0 && !selectedSize) {
        setSizeError('Please select a size before adding to cart.');
        // Scroll to size selector
        setTimeout(() => {
          const sizeSelect = document.getElementById('quickview-size-select');
          if (sizeSelect) {
            sizeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
            sizeSelect.focus();
          }
        }, 100);
        return;
      }
      
      // Clear size error if size is selected
      setSizeError(null);
      
      const images = getOrderedImages(product);
      const selectedImage = images.length > 0 ? images[selectedImageIndex] : product.imageUrl;
      
      try {
        await addItem({ 
          id: product.id.toString(), 
          name: product.name, 
          price: product.price,
          image: selectedImage || '/placeholder-product.jpg',
          slug: product.slug,
          size: selectedSize || undefined
        }, quantity);
        // Show success notification every time an item is added
        showAddToCart(product.name);
        onClose();
      } catch (error) {
        console.error('Error adding item to cart:', error);
        // Error handling is done by CartContext
      }
    }
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  const images = getOrderedImages(product);
  const selectedImage = images.length > 0 ? images[selectedImageIndex] : product.imageUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden">
          {/* Image Section */}
          <div className="relative w-full md:w-1/2 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            {selectedImage ? (
              <div className="relative aspect-square w-full h-full">
                <Image
                  src={getImageUrl(selectedImage) || ''}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700">
                <span className="text-8xl">👕</span>
              </div>
            )}

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 px-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      title={`View image ${index + 1}`}
                      aria-label={`Select image ${index + 1} of ${images.length}`}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Image
                        src={getImageUrl(img) || ''}
                        alt={`${product.name} view ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="space-y-4">
              {/* Category */}
              {product.categories && product.categories.length > 0 && (
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {product.categories[0].name}
                </p>
              )}

              {/* Product Name */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h2>

              {/* SKU */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                SKU: {product.SKU}
              </p>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              {product.stockInfo && (
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    product.stockInfo.isLowStock
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : product.stockInfo.isInStock 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {product.stockInfo.status}
                  </span>
                  {product.stockInfo.isLowStock && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Only a few left in stock!
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Size Selector */}
              {product.size && product.size.trim().length > 0 && (
                <div className="space-y-2 pt-4">
                  <label htmlFor="quickview-size-select" className="block text-sm font-semibold text-gray-900 dark:text-white">
                    Select Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="quickview-size-select"
                    value={selectedSize}
                    onChange={(e) => {
                      setSelectedSize(e.target.value);
                      // Clear error when size is selected
                      if (e.target.value) {
                        setSizeError(null);
                      }
                    }}
                    className={`w-full max-w-xs border-2 rounded-lg px-4 py-3 text-base font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      sizeError 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Choose your size
                    </option>
                    {product.size.split(',').map((sizeOption) => {
                      const trimmedSize = sizeOption.trim();
                      return (
                        <option 
                          key={trimmedSize} 
                          value={trimmedSize}
                        >
                          {trimmedSize}
                        </option>
                      );
                    })}
                  </select>
                  {sizeError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {sizeError}
                    </p>
                  )}
                  {selectedSize && !sizeError && (
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ Selected: {selectedSize}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 pt-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity:
                </label>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 text-gray-900 dark:text-white min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.quantity > 0 && quantity >= product.quantity}
                    aria-label="Increase quantity"
                    title="Increase quantity"
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.quantity === 0 || Boolean(product.size && product.size.trim().length > 0 && !selectedSize)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  {product.quantity === 0 
                    ? 'Out of Stock' 
                    : Boolean(product.size && product.size.trim().length > 0 && !selectedSize)
                    ? 'Select Size First'
                    : 'Add to Cart'}
                </button>
                <Link
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 font-medium rounded-lg transition-colors"
                >
                  <EyeIcon className="w-5 h-5" />
                  View Full Details
                </Link>
              </div>

              {/* Wishlist Button */}
              <div className="pt-2">
                <WishlistButton 
                  productId={product.id.toString()} 
                  size="md" 
                  variant="outline"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
