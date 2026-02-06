'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon, ArrowLeftIcon, CreditCardIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
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
  size?: string | null;
  stockInfo?: {
    quantity?: number;
    status: string;
    isInStock: boolean;
    isLowStock?: boolean;
  };
  sizeStockInfo?: Record<string, {
    quantity: number;
    status: string;
    isInStock: boolean;
    isLowStock: boolean;
  }>;
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
  const [error, setError] = useState<string | null>(null); // For product loading errors
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCartPanel, setShowCartPanel] = useState(false);
  // Toast for wishlist success
  const [wishlistToastVisible, setWishlistToastVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { addItem, buyNow } = useCart();
  const { clearAllErrors, showAddToCart } = useOrderNotification();

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
      // Use Next.js API proxy instead of direct backend call to avoid CORS issues
      const cacheBuster = `?t=${Date.now()}`;
      let apiUrl = `/api/products/${slug}${cacheBuster}`;
      
      // Try Next.js proxy first (works in both dev and production)
      let response: Response;
      
      try {
        response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      } catch (proxyError) {
        // If proxy fails, try direct backend URL as fallback
        const directBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        console.warn('Next.js proxy failed, trying direct backend URL:', proxyError);
        
        try {
          apiUrl = `${directBackendUrl}/products/${slug}${cacheBuster}`;
          response = await fetch(apiUrl, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        } catch (directError) {
          const errorMsg = directError instanceof Error ? directError.message : 'Failed to fetch from both proxy and direct URL';
          throw new Error(`Network error: ${errorMsg}. Please ensure the backend server is running.`);
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load product' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.product) {
        const productData = data.data.product;
        console.log('Product data received:', {
          name: productData.name,
          quantity: productData.quantity,
          size: productData.size,
          sizeStock: productData.sizeStock,
          sizeStockInfo: productData.sizeStockInfo
        });
        setProduct(productData);
        setError(null); // Clear any previous errors
        setSelectedSize(''); // Reset size selection when product changes
      } else {
        setError(data.message || 'Product not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load product. Please ensure the backend server is running.';
      setError(errorMessage);
      console.error('Error fetching product:', err);
      
      // Provide helpful error message
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        console.error('Network error detected. Check if:');
        console.error('1. Backend server is running on http://localhost:3001');
        console.error('2. CORS is properly configured');
        console.error('3. Next.js rewrites are working correctly');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug, fetchProduct]);

  // Auto-refresh product data when page comes into focus (to get latest stock)
  useEffect(() => {
    const handleFocus = () => {
      if (slug && !loading) {
        fetchProduct(); // Refresh product data
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [slug, loading, fetchProduct]);

  // Clear error notification when component unmounts or route changes
  useEffect(() => {
    return () => {
      // Cleanup: clear all error notifications when navigating away
      clearAllErrors();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on unmount

  const handleAddToCart = async () => {
    if (product) {
      // Validate size selection if product has sizes
      if (product.size && product.size.trim().length > 0 && !selectedSize) {
        setSizeError('Please select a size before adding to cart.');
        // Scroll to size selector
        const sizeSelect = document.getElementById('size-select');
        if (sizeSelect) {
          sizeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
          sizeSelect.focus();
        }
        return;
      }
      
      // Clear size error if size is selected
      setSizeError(null);
      
      const images = getOrderedImages(product);
      const selectedImage = images.length > 0 ? images[selectedImageIndex] : product.imageUrl;
      
      const cartItem = {
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug,
        size: selectedSize || undefined
      };
      console.log('Adding to cart:', cartItem); // Debug log
      
      try {
        await addItem(cartItem, selectedQuantity);
        
        // Clear any previous errors
        clearAllErrors(); // Clear error notifications
        
        // Show success notification every time an item is added
        showAddToCart(product.name);
        
        // Show cart panel after adding item
        setShowCartPanel(true);
      } catch (error) {
        console.error('Error adding item to cart:', error);
        // Error handling is done by CartContext
      }
    }
  };

  const handleBuyNow = () => {
    if (product) {
      // Validate size selection if product has sizes
      if (product.size && product.size.trim().length > 0 && !selectedSize) {
        setSizeError('Please select a size before proceeding to checkout.');
        // Scroll to size selector
        setTimeout(() => {
          const sizeSelect = document.getElementById('size-select');
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
      
      const cartItem = {
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug,
        size: selectedSize || undefined
      };
      console.log('Buy now cart item:', cartItem); // Debug log
      buyNow(cartItem, selectedQuantity);
      
      // Clear any previous errors
      clearAllErrors(); // Clear error notifications before navigating
      
      // Redirect to checkout
      router.push('/checkout');
    }
  };


  // Zoom functionality with improved controls
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.25;

  const calculatePanBounds = useCallback((zoom: number) => {
    if (!containerRef.current) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Calculate how much the image extends beyond the container
    const scaledWidth = containerWidth * zoom;
    const scaledHeight = containerHeight * zoom;
    const overflowX = (scaledWidth - containerWidth) / 2;
    const overflowY = (scaledHeight - containerHeight) / 2;
    
    return {
      minX: -overflowX,
      maxX: overflowX,
      minY: -overflowY,
      maxY: overflowY
    };
  }, []);

  const constrainPan = useCallback((x: number, y: number, zoom: number) => {
    const bounds = calculatePanBounds(zoom);
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
    };
  }, [calculatePanBounds]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + ZOOM_STEP, MAX_ZOOM);
      if (newZoom > prev) {
        setPanPosition(current => constrainPan(current.x, current.y, newZoom));
      }
      return newZoom;
    });
  }, [constrainPan]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      if (newZoom < prev) {
        setPanPosition(current => constrainPan(current.x, current.y, newZoom));
        // Reset pan if zoomed back to 1
        if (newZoom === MIN_ZOOM) {
          setPanPosition({ x: 0, y: 0 });
        }
      }
      return newZoom;
    });
  }, [constrainPan]);

  const handleZoomTo = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    setZoomLevel(clampedZoom);
    if (clampedZoom === MIN_ZOOM) {
      setPanPosition({ x: 0, y: 0 });
    } else {
      setPanPosition(current => constrainPan(current.x, current.y, clampedZoom));
    }
  }, [constrainPan]);

  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleImageClick = (e: React.MouseEvent) => {
    if (zoomLevel === MIN_ZOOM && containerRef.current) {
      // Zoom in at click position
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newZoom = 2.5;
      setZoomLevel(newZoom);
      
      // Calculate pan to center on click point
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      
      const panX = (centerX - x) * newZoom;
      const panY = (centerY - y) * newZoom;
      
      setPanPosition(constrainPan(panX, panY, newZoom));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > MIN_ZOOM) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - panPosition.x, 
        y: e.clientY - panPosition.y 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > MIN_ZOOM) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPanPosition(constrainPan(newX, newY, zoomLevel));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
    
    if (newZoom !== zoomLevel) {
      // Zoom towards cursor position
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      
      // Calculate zoom point relative to center
      const zoomPointX = (x - centerX) / zoomLevel;
      const zoomPointY = (y - centerY) / zoomLevel;
      
      // Adjust pan to keep zoom point under cursor
      const newPanX = panPosition.x - zoomPointX * (newZoom - zoomLevel);
      const newPanY = panPosition.y - zoomPointY * (newZoom - zoomLevel);
      
      setZoomLevel(newZoom);
      setPanPosition(constrainPan(newPanX, newPanY, newZoom));
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
                ref={containerRef}
                className={`aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm relative group ${
                  zoomLevel > MIN_ZOOM ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleImageClick}
              >
                {(() => {
                  const images = getOrderedImages(product);
                  const displayImage = images.length > 0 ? images[selectedImageIndex] : product.imageUrl;
                  
                  return displayImage ? (
                    <Image
                      src={getImageUrl(displayImage) || ''}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-200 ease-out select-none"
                      style={{
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                        transformOrigin: 'center center',
                        pointerEvents: zoomLevel > MIN_ZOOM ? 'none' : 'auto'
                      }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                      <span className="text-8xl">{getCategoryEmoji(product.categories)}</span>
                    </div>
                  );
                })()}
                
                {/* Zoom Controls Overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  {/* Zoom Level Indicator */}
                  <div className="bg-black/70 dark:bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                  
                  {/* Zoom Control Buttons */}
                  <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoomIn();
                      }}
                      disabled={zoomLevel >= MAX_ZOOM}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Zoom in"
                      title="Zoom in"
                    >
                      <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoomOut();
                      }}
                      disabled={zoomLevel <= MIN_ZOOM}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Zoom out"
                      title="Zoom out"
                    >
                      <MagnifyingGlassMinusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    {zoomLevel > MIN_ZOOM && (
                      <>
                        <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetZoom();
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs text-gray-700 dark:text-gray-300 font-medium"
                          aria-label="Reset zoom"
                          title="Reset zoom"
                        >
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Zoom hint */}
                {zoomLevel === MIN_ZOOM && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/70 dark:bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg">
                      Click to zoom • Scroll to zoom • Use controls
                    </div>
                  </div>
                )}
              </div>
              
              {/* Zoom Slider */}
              <div className="mt-4 px-2">
                <div className="flex items-center gap-3">
                  <MagnifyingGlassMinusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={ZOOM_STEP}
                    value={zoomLevel}
                    onChange={(e) => handleZoomTo(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                    aria-label="Zoom level"
                  />
                  <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Zoom instructions */}
              {zoomLevel > MIN_ZOOM && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag to pan • Scroll to zoom • Click Reset or press ESC to reset
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                SKU: {product.SKU}
              </p>
              <button
                onClick={() => fetchProduct()}
                disabled={loading}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh stock information"
                aria-label="Refresh stock"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

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
              {(() => {
                // Use stockInfo.status from backend (doesn't expose exact quantity)
                const hasSizes = product.size && product.size.trim().length > 0;
                const isInStock = product.stockInfo?.isInStock ?? (product.quantity ?? 0) > 0;
                const isLowStock = product.stockInfo?.isLowStock ?? false;
                const status = product.stockInfo?.status;
                
                // Products with sizes are made-to-order and always available
                if (hasSizes) {
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Available (Made to Order)
                    </span>
                  );
                } else {
                  // Use status from backend, fallback to calculated status
                  const displayStatus = status || (isInStock ? (isLowStock ? 'Low Stock' : 'In Stock') : 'Out of Stock');
                  
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      !isInStock
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : isLowStock
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {displayStatus}
                    </span>
                  );
                }
              })()}
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

            {/* Size Selector */}
            {product.size && product.size.trim().length > 0 && (
              <div className="space-y-3">
                <label htmlFor="size-select" className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Select Size <span className="text-red-500">*</span>
                </label>
                <select
                  id="size-select"
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
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
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
            <div className="flex items-center space-x-4">
              <span id="quantity-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity:
              </span>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))}
                  disabled={selectedQuantity <= 1}
                  className={`px-3 py-2 rounded-l-md border border-r-0 ${
                    selectedQuantity <= 1
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
                  aria-labelledby="quantity-label"
                  aria-live="polite"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setSelectedQuantity(q => Math.min(q + 1, 10))}
                  disabled={selectedQuantity >= 10}
                  className={`px-3 py-2 rounded-r-md border border-l-0 ${
                    selectedQuantity >= 10
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
                {(() => {
                  // Products with sizes are made-to-order and always available
                  // Products without sizes check stockInfo (doesn't expose exact quantity)
                  const hasSizes = product.size && product.size.trim().length > 0;
                  
                  // For products with sizes: always available (made-to-order), validation happens in handler
                  // For products without sizes: check stock status
                  const isOutOfStock = !hasSizes && !(product.stockInfo?.isInStock ?? (product.quantity ?? 0) > 0);
                  
                  return (
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <ShoppingBagIcon className="w-5 h-5 mr-2" />
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  );
                })()}
                
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
              
              {(() => {
                // Products with sizes are made-to-order and always available
                // Products without sizes check stockInfo (doesn't expose exact quantity)
                const hasSizes = product.size && product.size.trim().length > 0;
                
                // For products with sizes: always available (made-to-order), validation happens in handler
                // For products without sizes: check stock status
                const isOutOfStock = !hasSizes && !(product.stockInfo?.isInStock ?? (product.quantity ?? 0) > 0);
                
                return (
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <CreditCardIcon className="w-5 h-5 mr-2" />
                    {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                  </button>
                );
              })()}
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
