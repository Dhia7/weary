'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon, ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import CartPanel from '@/components/CartPanel';
import Navigation from '@/components/Navigation';
import WishlistButton from '@/components/WishlistButton';
import { getImageUrl } from '@/lib/utils';

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
  barcode?: string;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCartPanel, setShowCartPanel] = useState(false);
  // Toast for wishlist success
  const [wishlistToastVisible, setWishlistToastVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const { addItem, buyNow } = useCart();

  // Ensure main thumbnail is always first
  const getOrderedImages = useCallback((p?: Product | null) => {
    if (!p || !p.images || p.images.length === 0) return [] as string[];
    const images = p.images;
    const mainIndex = typeof p.mainThumbnailIndex === 'number' ? p.mainThumbnailIndex : 0;
    const clampedIndex = Math.max(0, Math.min(mainIndex, images.length - 1));
    if (clampedIndex === 0) return images;
    const main = images[clampedIndex];
    return [main, ...images.filter((_, i) => i !== clampedIndex)];
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/products/${slug}`);
      const data = await response.json();
      
      if (response.ok) {
        setProduct(data.data.product);
      } else {
        setError(data.message || 'Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug, fetchProduct]);

  const handleAddToCart = () => {
    if (product) {
      const images = getOrderedImages(product);
      const selectedImage = images.length > 0 ? images[selectedImageIndex] : product.imageUrl;
      
      const cartItem = {
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug
      };
      console.log('Adding to cart:', cartItem); // Debug log
      addItem(cartItem, selectedQuantity);
      
      // Show cart panel after adding item
      setShowCartPanel(true);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      const images = getOrderedImages(product);
      const selectedImage = images.length > 0 ? images[selectedImageIndex] : product.imageUrl;
      
      // Clear existing cart and add only this item
      const cartItem = {
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug
      };
      console.log('Buy now cart item:', cartItem); // Debug log
      buyNow(cartItem, selectedQuantity);
      
      // Redirect to checkout immediately
      router.push('/checkout');
    }
  };


  // Zoom functionality
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 1));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          resetZoom();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, resetZoom]);

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };


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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Product not found'}
          </h1>
          <Link 
            href="/"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">
            Home
          </Link>
          <span>/</span>
          {product.categories && product.categories.length > 0 && (
            <>
              <Link 
                href={`/category/${product.categories[0].slug}`}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                {product.categories[0].name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 dark:text-white">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image Display */}
            <div className="relative">
              <div 
                ref={imageRef}
                className={`aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm relative group ${
                  zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {(() => {
                  const images = getOrderedImages(product);
                  const displayImage = images.length > 0 ? images[selectedImageIndex] : product.imageUrl;
                  
                  return displayImage ? (
                    <Image
                      src={getImageUrl(displayImage) || ''}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 ease-out"
                      style={{
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                        transformOrigin: 'center center'
                      }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                      <span className="text-8xl">{getCategoryEmoji(product.categories)}</span>
                    </div>
                  );
                })()}
                
                {/* Zoom indicator */}
                {zoomLevel > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                )}
                
                {/* Zoom hint */}
                {zoomLevel === 1 && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      Scroll to zoom
                    </div>
                  </div>
                )}
              </div>
              
              {/* Zoom instructions */}
              {zoomLevel > 1 && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag to pan • Scroll to zoom • ESC to reset
                  </p>
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {getOrderedImages(product).length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {getOrderedImages(product).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    title={`Select image ${index + 1}`}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-blue-500 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Image
                      src={getImageUrl(image) || ''}
                      alt={`${product.name} - Image ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {product.categories && product.categories.length > 0 && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                {product.categories[0].name}
              </p>
            )}

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {product.name}
            </h1>

            {/* SKU */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              SKU: {product.SKU}
            </p>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {product.quantity === 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Out of Stock
                </span>
              ) : product.quantity <= 5 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Low Stock
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  In Stock
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300">
                <p>{product.description}</p>
              </div>
            )}

            {/* Weight */}
            {product.weightGrams && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Weight:</strong> {product.weightGrams}g
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span id="quantity-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity:
              </span>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))}
                  disabled={product.quantity === 0 || selectedQuantity <= 1}
                  className={`px-3 py-2 rounded-l-md border border-r-0 ${
                    product.quantity === 0 || selectedQuantity <= 1
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  −
                </button>
                <input
                  id="quantity"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={selectedQuantity}
                  onChange={() => { /* prevent manual edits to avoid exposing limits */ }}
                  readOnly
                  className="w-12 text-center border border-gray-300 dark:border-gray-600 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={product.quantity === 0}
                  aria-labelledby="quantity-label"
                  aria-live="polite"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setSelectedQuantity(q => Math.min(q + 1, Math.min(10, product.quantity)))}
                  disabled={product.quantity === 0 || selectedQuantity >= Math.min(10, product.quantity)}
                  className={`px-3 py-2 rounded-r-md border border-l-0 ${
                    product.quantity === 0 || selectedQuantity >= Math.min(10, product.quantity)
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.quantity === 0}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <ShoppingBagIcon className="w-5 h-5 mr-2" />
                  {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                <WishlistButton 
                  productId={product.id.toString()} 
                  size="lg" 
                  variant="default"
                  onToggle={(inWishlist) => {
                    if (inWishlist) {
                      setWishlistToastVisible(true);
                      window.clearTimeout((window as unknown as { __wl_toast__?: number }).__wl_toast__ || 0);
                      (window as unknown as { __wl_toast__?: number }).__wl_toast__ = window.setTimeout(() => setWishlistToastVisible(false), 2000);
                    }
                  }}
                />
              </div>
              
              <button
                onClick={handleBuyNow}
                disabled={product.quantity === 0}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <CreditCardIcon className="w-5 h-5 mr-2" />
                {product.quantity === 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Free shipping</strong> on orders over $50
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>30-day returns</strong> for unused items
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Secure checkout</strong> with SSL encryption
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cart Panel */}
      <CartPanel 
        isOpen={showCartPanel} 
        onClose={() => setShowCartPanel(false)} 
      />

      {/* Wishlist success toast */}
      {wishlistToastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur flex items-center gap-2 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.69a.75.75 0 10-1.22-.86l-3.46 4.92-1.71-1.71a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.16-.1l4.04-5.58z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Added to your wishlist</span>
          </div>
        </div>
      )}
    </div>
  );
}
