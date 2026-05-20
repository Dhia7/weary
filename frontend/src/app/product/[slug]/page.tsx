'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBagIcon, ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import CartPanel from '@/components/CartPanel';
import Navigation from '@/components/Navigation';
import WishlistButton from '@/components/WishlistButton';
import {
  findVariant,
  getVariantPrice,
  getColorPrice,
  formatPriceTnd,
  getEffectiveCompareAtPrice,
  getProductMaxStock,
  isProductSoldOut,
  shouldShowCompareAtPrice,
} from '@/lib/types/product';
import QuantitySelector from '@/components/product/QuantitySelector';
import ColorSwatches from '@/components/ColorSwatches';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import {
  getPrimaryDisplayImage,
  getProductDisplayImages,
} from '@/lib/utils/productImages';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslatedText } from '@/lib/hooks/useTranslatedText';
import { getProductTranslations, translateCategoryName } from '@/lib/i18n/product';
import { useProduct } from '@/lib/hooks/useProduct';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { product, loading, error: fetchError, mutate } = useProduct(slug);
  const error = fetchError?.message ?? null;
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [showCartPanel, setShowCartPanel] = useState(false);
  // Toast for wishlist success
  const [wishlistToastVisible, setWishlistToastVisible] = useState(false);
  const { addItem, buyNow } = useCart();
  const { clearAllErrors, showAddToCart } = useOrderNotification();
  const { isFrench } = useLanguage();
  const t = useMemo(() => getProductTranslations(isFrench), [isFrench]);
  const { text: productDescription, isLoading: descriptionTranslating } =
    useTranslatedText(product?.description, isFrench);
  const { text: outerMaterialText } = useTranslatedText(product?.outerMaterial, isFrench);

  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants) return undefined;
    return findVariant(product.variants, selectedColor, selectedSize || undefined);
  }, [product, selectedColor, selectedSize]);

  const displayPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant) return getVariantPrice(selectedVariant, product);
    if (selectedColor && product.hasVariants) {
      const colorPrice = getColorPrice(product, selectedColor);
      if (colorPrice != null) return colorPrice;
    }
    if (product.priceRange?.hasVariablePricing) return product.priceRange.min;
    return Number(product.price);
  }, [product, selectedVariant, selectedColor]);

  const effectiveCompareAt = product
    ? getEffectiveCompareAtPrice(product, selectedVariant)
    : null;

  const isOutOfStock = useMemo(() => {
    if (!product) return false;
    return isProductSoldOut(product, selectedVariant);
  }, [product, selectedVariant]);

  const maxPurchasableQty = useMemo(() => {
    if (!product) return 0;
    return getProductMaxStock(product, selectedVariant);
  }, [product, selectedVariant]);

  const showQuantitySelector = Boolean(
    product?.allowCustomerQuantity && maxPurchasableQty > 0 && !isOutOfStock
  );

  useEffect(() => {
    setSelectedQuantity(1);
  }, [slug, selectedColor, selectedSize, product?.allowCustomerQuantity]);

  const sizeChoices = useMemo(() => {
    if (!product) return [] as string[];
    if (product.hasVariants && product.availableSizes?.length) {
      return product.availableSizes;
    }
    if (product.size?.trim()) {
      return product.size.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [product]);

  const displayImages = useMemo(
    () =>
      getProductDisplayImages(product, {
        selectedColor,
        selectedVariant,
      }),
    [product, selectedColor, selectedVariant]
  );

  const galleryMediaLabel = useMemo(() => {
    if (!product?.hasVariants || !selectedColor) return undefined;
    const colorImages = getProductDisplayImages(product, { selectedColor });
    const defaultImages = getProductDisplayImages(product, {});
    if (
      colorImages.length > 0 &&
      colorImages.join('|') !== defaultImages.join('|')
    ) {
      return t.showingImagesFor(selectedColor);
    }
    return undefined;
  }, [product, selectedColor, t]);

  useEffect(() => {
    if (product) {
      setSelectedSize('');
      setSelectedColor(product.colorOptions?.[0]?.name || '');
      setColorError(null);
    }
  }, [product]);

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
      if (isOutOfStock) return;
      if (product.hasVariants && !selectedColor) {
        setColorError(t.selectColorCart);
        return;
      }
      if (sizeChoices.length > 0 && !selectedSize) {
        setSizeError(t.selectSizeCart);
        const sizeSelect = document.getElementById('size-select');
        if (sizeSelect) {
          sizeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
          sizeSelect.focus();
        }
        return;
      }
      if (product.hasVariants && selectedVariant && isOutOfStock) {
        setColorError(t.variantOutOfStock);
        return;
      }
      if (!product.hasVariants && isOutOfStock) {
        return;
      }
      setSizeError(null);
      setColorError(null);
      
      const selectedImage =
        getPrimaryDisplayImage(product, { selectedColor, selectedVariant }) ||
        product.imageUrl;

      const cartItem = {
        id: product.id.toString(),
        productId: product.id.toString(),
        name: product.name,
        price: displayPrice,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug,
        size: selectedSize || selectedVariant?.size || undefined,
        color: selectedColor || selectedVariant?.color || undefined,
        variantId: selectedVariant?.id ? String(selectedVariant.id) : undefined,
        allowCustomerQuantity: Boolean(product.allowCustomerQuantity),
        maxStock: maxPurchasableQty,
      };
      
      try {
        await addItem(cartItem, showQuantitySelector ? selectedQuantity : 1);
        
        // Clear any previous errors
        clearAllErrors(); // Clear error notifications
        
        // Show success notification every time an item is added
        showAddToCart(product.name);
      } catch (error) {
        console.error('Error adding item to cart:', error);
        // Error handling is done by CartContext
      }
    }
  };

  const handleBuyNow = () => {
    if (product) {
      if (isOutOfStock) return;
      if (product.hasVariants && !selectedColor) {
        setColorError(t.selectColorCheckout);
        return;
      }
      if (sizeChoices.length > 0 && !selectedSize) {
        setSizeError(t.selectSizeCheckout);
        setTimeout(() => {
          const sizeSelect = document.getElementById('size-select');
          if (sizeSelect) {
            sizeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
            sizeSelect.focus();
          }
        }, 100);
        return;
      }
      if (product.hasVariants && selectedVariant && isOutOfStock) {
        setColorError(t.variantOutOfStock);
        return;
      }
      if (!product.hasVariants && isOutOfStock) {
        return;
      }

      setSizeError(null);
      setColorError(null);
      
      const selectedImage =
        getPrimaryDisplayImage(product, { selectedColor, selectedVariant }) ||
        product.imageUrl;

      const cartItem = {
        id: product.id.toString(),
        productId: product.id.toString(),
        name: product.name,
        price: displayPrice,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug,
        size: selectedSize || selectedVariant?.size || undefined,
        color: selectedColor || selectedVariant?.color || undefined,
        variantId: selectedVariant?.id ? String(selectedVariant.id) : undefined,
        allowCustomerQuantity: Boolean(product.allowCustomerQuantity),
        maxStock: maxPurchasableQty,
      };
      buyNow(cartItem, showQuantitySelector ? selectedQuantity : 1);
      
      // Clear any previous errors
      clearAllErrors(); // Clear error notifications before navigating
      
      // Redirect to checkout
      router.push('/checkout');
    }
  };


  const formatPrice = formatPriceTnd;


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

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || t.productNotFound}
          </h1>
          {error && (
            <button
              type="button"
              onClick={() => mutate()}
              className="mb-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Try Again
            </button>
          )}
          <Link 
            href="/"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav aria-label={t.breadcrumbAria} className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">
            {t.home}
          </Link>
          <span>/</span>
          {product.categories && product.categories.length > 0 && (
            <>
              <Link 
                href={`/category/${product.categories[0].slug}`}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                {translateCategoryName(product.categories[0].name, isFrench)}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 dark:text-white">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImageGallery
            images={displayImages}
            alt={product.name}
            fallbackEmoji={getCategoryEmoji(product.categories)}
            mediaLabel={galleryMediaLabel}
            galleryKey={`${selectedColor}-${displayImages[0] ?? ''}`}
          />

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {product.categories && product.categories.length > 0 && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                {translateCategoryName(product.categories[0].name, isFrench)}
              </p>
            )}

            {/* Product Name */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>
              {product.displayBadge === 'sold' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-900 text-white dark:bg-foreground dark:text-background">
                  {isFrench ? 'Vendu' : 'Sold'}
                </span>
              )}
              {product.displayBadge === 'new_arrival' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white">
                  {isFrench ? 'Nouveauté' : 'New Arrival'}
                </span>
              )}
            </div>

            {/* SKU */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              SKU: {product.SKU}
            </p>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(displayPrice)}
                </span>
                {shouldShowCompareAtPrice(effectiveCompareAt, displayPrice) && (
                  <span className="text-xl text-red-600 dark:text-red-400 line-through">
                    {formatPrice(effectiveCompareAt!)}
                  </span>
                )}
              </div>
              {product.priceRange?.hasVariablePricing && !selectedVariant && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedColor
                    ? sizeChoices.length > 0
                      ? 'Price may vary by size — select a size for the exact amount.'
                      : null
                    : 'Price varies by color — select a color to see your price.'}
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {isFrench ? t.descriptionFr : t.description}
                </p>
                <p className="text-gray-500 dark:text-gray-400 whitespace-pre-line">
                  {descriptionTranslating ? '…' : productDescription}
                </p>
              </div>
            )}

            {/* Weight */}
            {(product.depthCm || product.widthCm || product.heightCm) && (
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">{t.dimensions}</p>
                <ul className="space-y-0.5 text-gray-500 dark:text-gray-400">
                  {product.depthCm != null && product.depthCm > 0 && (
                    <li><span className="text-gray-700 dark:text-gray-300">{t.depth}:</span> {Number(product.depthCm)} cm</li>
                  )}
                  {product.widthCm != null && product.widthCm > 0 && (
                    <li><span className="text-gray-700 dark:text-gray-300">{t.width}:</span> {Number(product.widthCm)} cm</li>
                  )}
                  {product.heightCm != null && product.heightCm > 0 && (
                    <li><span className="text-gray-700 dark:text-gray-300">{t.height}:</span> {Number(product.heightCm)} cm</li>
                  )}
                </ul>
              </div>
            )}

            {product.outerMaterial && (
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">{t.materials}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  <span className="text-gray-700 dark:text-gray-300">{t.outerMaterial}:</span>{' '}
                  {isFrench && outerMaterialText ? outerMaterialText : product.outerMaterial}
                </p>
              </div>
            )}

            {product.weightGrams && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>{t.weight}:</strong> {product.weightGrams}g
              </div>
            )}

            {product.hasVariants && product.colorOptions && product.colorOptions.length > 0 && (
              <div className="space-y-3">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                  {t.color} <span className="text-red-500">*</span>
                </span>
                <ColorSwatches
                  colors={product.colorOptions}
                  selectedColor={selectedColor}
                  onSelect={(color) => {
                    setSelectedColor(color);
                    setColorError(null);
                    if (product.hasVariants && product.availableSizes?.length) {
                      setSelectedSize('');
                    }
                  }}
                  size="md"
                />
                {colorError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{colorError}</p>
                )}
                {selectedColor && !colorError && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t.selected(selectedColor)}</p>
                )}
              </div>
            )}

            {/* Size Selector */}
            {sizeChoices.length > 0 && (
              <div className="space-y-3">
                <label htmlFor="size-select" className="block text-sm font-semibold text-gray-900 dark:text-white">
                  {t.selectSize} <span className="text-red-500">*</span>
                </label>
                <select
                  id="size-select"
                  value={selectedSize}
                  onChange={(e) => {
                    setSelectedSize(e.target.value);
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
                    {t.chooseSize}
                  </option>
                  {sizeChoices.map((trimmedSize) => (
                    <option key={trimmedSize} value={trimmedSize}>
                      {trimmedSize}
                    </option>
                  ))}
                </select>
                {sizeError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {sizeError}
                  </p>
                )}
                {selectedSize && !sizeError && (
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {t.selectedSize(selectedSize)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {showQuantitySelector && (
              <QuantitySelector
                quantity={selectedQuantity}
                maxQuantity={maxPurchasableQty}
                onChange={setSelectedQuantity}
              />
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <ShoppingBagIcon className="w-5 h-5 mr-2" />
                  {isOutOfStock ? t.outOfStock : t.addToCart}
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
                disabled={isOutOfStock}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <CreditCardIcon className="w-5 h-5 mr-2" />
                {isOutOfStock ? t.outOfStock : t.buyNow}
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>{t.freeShipping}</strong> {t.freeShippingDetail}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>{t.returns}</strong> {t.returnsDetail}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <strong>{t.secureCheckout}</strong> {t.secureCheckoutDetail}
              </div>
            </div>
          </div>
        </div>
      </main>
      
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
            <span className="text-sm font-medium">{t.wishlistAdded}</span>
          </div>
        </div>
      )}
    </div>
  );
}
