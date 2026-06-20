'use client';

import { useEffect, useState, useMemo } from 'react';
import { XMarkIcon, ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import { getImageUrl } from '@/lib/utils';
import WishlistButton from './WishlistButton';
import ColorSwatches from './ColorSwatches';
import type { Product } from '@/lib/types/product';
import {
  findVariant,
  getVariantPrice,
  getColorPrice,
  formatPriceTnd,
  getEffectiveCompareAtPrice,
  getProductHref,
  getProductMaxStock,
  isProductSoldOut,
  resolveProductColor,
  shouldShowCompareAtPrice,
} from '@/lib/types/product';
import QuantitySelector from '@/components/product/QuantitySelector';
import {
  getPrimaryDisplayImage,
  getProductDisplayImages,
} from '@/lib/utils/productImages';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslatedText } from '@/lib/hooks/useTranslatedText';
import { getProductTranslations, translateCategoryName } from '@/lib/i18n/product';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const QuickViewModal = ({ isOpen, onClose, product }: QuickViewModalProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { showAddToCart } = useOrderNotification();
  const { isFrench } = useLanguage();
  const t = useMemo(() => getProductTranslations(isFrench), [isFrench]);
  const { text: productDescription, isLoading: descriptionTranslating } =
    useTranslatedText(product?.description, isFrench);

  // Reset state when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setSelectedImageIndex(0);
      setSelectedQuantity(1);
      setSelectedSize('');
      setSelectedColor(resolveProductColor(product));
      setSizeError(null);
      setColorError(null);
    }
  }, [isOpen, product]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedQuantity(1);
  }, [selectedColor, selectedSize, product?.allowCustomerQuantity]);

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

  const displayImages = useMemo(
    () =>
      getProductDisplayImages(product, {
        selectedColor,
        selectedVariant,
      }),
    [product, selectedColor, selectedVariant]
  );

  const handleAddToCart = async () => {
    if (product) {
      if (isOutOfStock) return;
      if (product.hasVariants && !selectedColor) {
        setColorError(t.selectColor);
        return;
      }
      if (sizeChoices.length > 0 && !selectedSize) {
        setSizeError(t.selectSizeCart);
        setTimeout(() => {
          document.getElementById('quickview-size-select')?.focus();
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
        displayImages[selectedImageIndex] ||
        getPrimaryDisplayImage(product, { selectedColor, selectedVariant }) ||
        product.imageUrl;
      
      try {
        await addItem({ 
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
        }, showQuantitySelector ? selectedQuantity : 1);
        // Show success notification every time an item is added
        showAddToCart(product.name);
        onClose();
      } catch (error) {
        console.error('Error adding item to cart:', error);
        // Error handling is done by CartContext
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  const selectedImage =
    displayImages[selectedImageIndex] ||
    getPrimaryDisplayImage(product, { selectedColor, selectedVariant }) ||
    product.imageUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t.closeModal}
        >
          <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden">
          {/* Image Section */}
          <div className="relative w-full md:w-1/2 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            {product.displayBadge === 'sold' && (
              <span className="absolute top-4 left-4 z-10 bg-gray-900/90 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider dark:bg-foreground/90 dark:text-background">
                {isFrench ? 'Vendu' : 'Sold'}
              </span>
            )}
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
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 px-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {displayImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      title={t.viewImage(index + 1)}
                      aria-label={t.selectImage(index + 1, displayImages.length)}
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
                  {translateCategoryName(product.categories[0].name, isFrench)}
                </p>
              )}

              {/* Product Name */}
              <h2 id="quick-view-title" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h2>

              {/* SKU */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                SKU: {product.SKU}
              </p>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPriceTnd(displayPrice)}
                  </span>
                  {shouldShowCompareAtPrice(effectiveCompareAt, displayPrice) && (
                    <span className="text-lg text-red-600 dark:text-red-400 line-through">
                      {formatPriceTnd(effectiveCompareAt!)}
                    </span>
                  )}
                </div>
              </div>

              {product.hasVariants && product.colorOptions && product.colorOptions.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {t.color} <span className="text-red-500">*</span>
                  </span>
                  <ColorSwatches
                    colors={product.colorOptions}
                    selectedColor={selectedColor}
                    onSelect={(color) => {
                      setSelectedColor(color);
                      setColorError(null);
                      if (product.availableSizes?.length) setSelectedSize('');
                    }}
                    size="md"
                  />
                  {colorError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{colorError}</p>
                  )}
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 whitespace-pre-line">
                    {descriptionTranslating ? '…' : productDescription}
                  </p>
                </div>
              )}

              {/* Size Selector */}
              {sizeChoices.length > 0 && (
                <div className="space-y-2 pt-4">
                  <label htmlFor="quickview-size-select" className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {t.selectSize} <span className="text-red-500">*</span>
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
                      {t.chooseSize}
                    </option>
                    {sizeChoices.map((trimmedSize) => (
                      <option key={trimmedSize} value={trimmedSize}>
                        {trimmedSize}
                      </option>
                    ))}
                  </select>
                  {sizeError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
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
                  id="quickview-quantity"
                  quantity={selectedQuantity}
                  maxQuantity={maxPurchasableQty}
                  onChange={setSelectedQuantity}
                  className="pt-4"
                />
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    isOutOfStock ||
                    (sizeChoices.length > 0 && !selectedSize)
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  {isOutOfStock
                    ? t.outOfStock
                    : sizeChoices.length > 0 && !selectedSize
                      ? t.selectSizeFirst
                      : t.addToCart}
                </button>
                <Link
                  href={getProductHref(product.slug, selectedColor || undefined)}
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 font-medium rounded-lg transition-colors"
                >
                  <EyeIcon className="w-5 h-5" />
                  {t.viewFullDetails}
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
