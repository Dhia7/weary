'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBagIcon, ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotFoundState from '@/components/NotFoundState';
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
  resolveProductColor,
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
import { getProductTranslations, translateCategoryName, getProductDisplayName, getColorDisplayName } from '@/lib/i18n/product';
import { useProduct } from '@/lib/hooks/useProduct';
import {
  bodyTextClass,
  inlineLinkClass,
  inputClass,
  pageShellClass,
} from '@/lib/content-page-styles';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const colorParam = searchParams.get('color');
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
  const displayName = product ? getProductDisplayName(product, isFrench) : '';
  const selectedColorLabel = getColorDisplayName(
    selectedColor,
    isFrench,
    product?.colorOptions
  );
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
      return t.showingImagesFor(selectedColorLabel);
    }
    return undefined;
  }, [product, selectedColor, selectedColorLabel, t]);

  useEffect(() => {
    if (product) {
      setSelectedSize('');
      setSelectedColor(resolveProductColor(product, colorParam));
      setColorError(null);
    }
  }, [product, colorParam]);

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
        nameFr: product.nameFr || null,
        price: displayPrice,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug,
        size: selectedSize || selectedVariant?.size || undefined,
        color: selectedColor || selectedVariant?.color || undefined,
        colorFr:
          selectedVariant?.colorFr ||
          product.colorOptions?.find(
            (c) => c.name.toLowerCase() === (selectedColor || '').toLowerCase()
          )?.nameFr ||
          null,
        variantId: selectedVariant?.id ? String(selectedVariant.id) : undefined,
        allowCustomerQuantity: Boolean(product.allowCustomerQuantity),
        maxStock: maxPurchasableQty,
      };
      
      try {
        await addItem(cartItem, showQuantitySelector ? selectedQuantity : 1);
        
        // Clear any previous errors
        clearAllErrors(); // Clear error notifications
        
        // Show success notification every time an item is added
        showAddToCart(displayName);
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
        nameFr: product.nameFr || null,
        price: displayPrice,
        image: selectedImage || '/placeholder-product.jpg',
        slug: product.slug,
        size: selectedSize || selectedVariant?.size || undefined,
        color: selectedColor || selectedVariant?.color || undefined,
        colorFr:
          selectedVariant?.colorFr ||
          product.colorOptions?.find(
            (c) => c.name.toLowerCase() === (selectedColor || '').toLowerCase()
          )?.nameFr ||
          null,
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
      <div className={`${pageShellClass} flex flex-col`}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center pt-28 pb-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <NotFoundState
        title={error || t.productNotFound}
        onRetry={error ? () => mutate() : undefined}
        homeLabel={t.backToHome}
        showBack={!error}
      />
    );
  }

  return (
    <div className={pageShellClass}>
      <Navigation />
      <main id="main-content" className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <nav
          aria-label={t.breadcrumbAria}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-swisse-ink/50 dark:text-muted-foreground mb-10"
        >
          <Link href="/" className={`${inlineLinkClass} text-swisse-ink/50 dark:text-muted-foreground`}>
            {t.home}
          </Link>
          <span aria-hidden>/</span>
          {product.categories && product.categories.length > 0 && (
            <>
              <Link
                href={`/category/${product.categories[0].slug}`}
                className={inlineLinkClass}
              >
                {translateCategoryName(product.categories[0].name, isFrench)}
              </Link>
              <span aria-hidden>/</span>
            </>
          )}
          <span className="text-swisse-ink dark:text-foreground">{displayName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <ProductImageGallery
            images={displayImages}
            alt={displayName}
            fallbackEmoji={getCategoryEmoji(product.categories)}
            mediaLabel={galleryMediaLabel}
            galleryKey={`${selectedColor}-${displayImages[0] ?? ''}`}
          />

          <div className="space-y-8 border border-swisse-gold/20 dark:border-border bg-white/90 dark:bg-card shadow-sm p-6 sm:p-8">
            {product.categories && product.categories.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-swisse-gold">
                {translateCategoryName(product.categories[0].name, isFrench)}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl text-swisse-ink dark:text-foreground">
                {displayName}
              </h1>
              {product.displayBadge === 'sold' && (
                <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-swisse-ink text-swisse-canvas dark:bg-foreground dark:text-background">
                  {isFrench ? 'Vendu' : 'Sold'}
                </span>
              )}
              {product.displayBadge === 'new_arrival' && (
                <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-swisse-gold text-white">
                  {isFrench ? 'Nouveauté' : 'New Arrival'}
                </span>
              )}
            </div>

            <p className={`text-xs uppercase tracking-widest ${bodyTextClass}`}>
              SKU: {product.SKU}
            </p>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-serif text-3xl text-swisse-ink dark:text-foreground">
                  {formatPrice(displayPrice)}
                </span>
                {shouldShowCompareAtPrice(effectiveCompareAt, displayPrice) && (
                  <span className="text-xl text-swisse-ink/40 dark:text-muted-foreground line-through">
                    {formatPrice(effectiveCompareAt!)}
                  </span>
                )}
              </div>
              {product.priceRange?.hasVariablePricing && !selectedVariant && (
                <p className={`text-sm ${bodyTextClass}`}>
                  {selectedColor
                    ? sizeChoices.length > 0
                      ? 'Price may vary by size — select a size for the exact amount.'
                      : null
                    : 'Price varies by color — select a color to see your price.'}
                </p>
              )}
            </div>

            {product.description && (
              <div className={`text-sm space-y-2 ${bodyTextClass}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground">
                  {isFrench ? t.descriptionFr : t.description}
                </p>
                <p className="whitespace-pre-line leading-relaxed">
                  {descriptionTranslating ? '…' : productDescription}
                </p>
              </div>
            )}

            {(product.depthCm || product.widthCm || product.heightCm) && (
              <div className={`text-sm space-y-2 ${bodyTextClass}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground">
                  {t.dimensions}
                </p>
                <ul className="space-y-1">
                  {product.depthCm != null && product.depthCm > 0 && (
                    <li><span className="text-swisse-ink/80 dark:text-foreground">{t.depth}:</span> {Number(product.depthCm)} cm</li>
                  )}
                  {product.widthCm != null && product.widthCm > 0 && (
                    <li><span className="text-swisse-ink/80 dark:text-foreground">{t.width}:</span> {Number(product.widthCm)} cm</li>
                  )}
                  {product.heightCm != null && product.heightCm > 0 && (
                    <li><span className="text-swisse-ink/80 dark:text-foreground">{t.height}:</span> {Number(product.heightCm)} cm</li>
                  )}
                </ul>
              </div>
            )}

            {product.outerMaterial && (
              <div className={`text-sm space-y-2 ${bodyTextClass}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground">
                  {t.materials}
                </p>
                <p>
                  <span className="text-swisse-ink/80 dark:text-foreground">{t.outerMaterial}:</span>{' '}
                  {isFrench && outerMaterialText ? outerMaterialText : product.outerMaterial}
                </p>
              </div>
            )}

            {product.weightGrams && (
              <div className={`text-sm ${bodyTextClass}`}>
                <span className="text-swisse-ink/80 dark:text-foreground font-medium">{t.weight}:</span> {product.weightGrams}g
              </div>
            )}

            {product.hasVariants && product.colorOptions && product.colorOptions.length > 0 && (
              <div className="space-y-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground">
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
                  <p className={`text-sm ${bodyTextClass}`}>{t.selected(selectedColorLabel)}</p>
                )}
              </div>
            )}

            {sizeChoices.length > 0 && (
              <div className="space-y-3">
                <label
                  htmlFor="size-select"
                  className="block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground"
                >
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
                  className={`${inputClass} max-w-xs ${
                    sizeError ? 'border-red-500 dark:border-red-500' : ''
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
                    <span className="inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-swisse-gold/30 text-swisse-gold">
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

            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-swisse-ink hover:bg-swisse-gold disabled:opacity-50 disabled:cursor-not-allowed text-swisse-canvas text-[10px] font-bold uppercase tracking-widest py-3.5 px-4 transition-colors duration-300 flex items-center justify-center gap-2 dark:bg-foreground dark:text-background dark:hover:bg-primary"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  {isOutOfStock ? t.outOfStock : t.addToCart}
                </button>

                <WishlistButton
                  productId={product.id.toString()}
                  size="lg"
                  variant="outline"
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
                className="w-full border border-swisse-gold/30 text-swisse-ink hover:border-swisse-gold hover:text-swisse-gold disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold uppercase tracking-widest py-3.5 px-4 transition-colors flex items-center justify-center gap-2 dark:text-foreground"
              >
                <CreditCardIcon className="w-5 h-5" />
                {isOutOfStock ? t.outOfStock : t.buyNow}
              </button>
            </div>

            <div className="border-t border-swisse-gold/15 dark:border-border pt-6 space-y-3">
              <div className={`text-sm ${bodyTextClass}`}>
                <strong className="text-swisse-ink dark:text-foreground">{t.freeShipping}</strong> {t.freeShippingDetail}
              </div>
              <div className={`text-sm ${bodyTextClass}`}>
                <strong className="text-swisse-ink dark:text-foreground">{t.returns}</strong> {t.returnsDetail}
              </div>
              <div className={`text-sm ${bodyTextClass}`}>
                <strong className="text-swisse-ink dark:text-foreground">{t.secureCheckout}</strong> {t.secureCheckoutDetail}
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
          <div className="px-5 py-2.5 shadow-sm bg-white/95 dark:bg-card/95 backdrop-blur flex items-center gap-2 text-swisse-ink dark:text-foreground border border-swisse-gold/20 dark:border-border">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-swisse-gold">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.69a.75.75 0 10-1.22-.86l-3.46 4.92-1.71-1.71a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.16-.1l4.04-5.58z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{t.wishlistAdded}</span>
          </div>
        </div>
      )}
    </div>
  );
}
