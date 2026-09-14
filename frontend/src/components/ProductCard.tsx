'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import { getImageUrl } from '@/lib/utils';
import WishlistButton from './WishlistButton';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { Product } from '@/lib/types/product';
import {
  findVariant,
  formatProductPriceLabel,
  getColorCompareAtPrice,
  getColorPrice,
  getDisplayBadge,
  getListingPrice,
  getProductHref,
  getProductMaxStock,
  getVariantPrice,
  isColorSold,
  isProductSoldOut,
  productHasSizes,
  resolveProductColor,
  toPriceNumber,
} from '@/lib/types/product';
import ColorSwatches from '@/components/ColorSwatches';
import { getHoverDisplayImage, getPrimaryDisplayImage } from '@/lib/utils/productImages';
import { getProductDisplayName, getProductTranslations } from '@/lib/i18n/product';
import { getSoldInquiryHref } from '@/lib/shopLinks';
import { useHoverImageReveal } from '@/lib/hooks/useHoverImageReveal';
import StorePriceCaption from '@/components/product/StorePriceCaption';
import SoldBadge from '@/components/product/SoldBadge';
import SoldAskButton from '@/components/product/SoldAskButton';
import { soldPhotoClass } from '@/components/product/soldPhotoClass';

const QuickViewModal = dynamic(() => import('./QuickViewModal'), { ssr: false });

export type ProductCardVariant = 'default' | 'editorial';

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
}

const ProductCard = memo(({ product, variant = 'default' }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(() => resolveProductColor(product));

  useEffect(() => {
    setSelectedColor(resolveProductColor(product));
  }, [product.id, product.colorOptions, product.defaultDisplayColor, product.variants]);

  const selectedVariant = useMemo(() => {
    if (!product.hasVariants || !selectedColor) return undefined;
    return findVariant(product.variants, selectedColor);
  }, [product, selectedColor]);

  const productHref = getProductHref(product.slug, selectedColor || undefined);
  const colorOpts = { selectedColor: selectedColor || undefined };
  const displayImage =
    getPrimaryDisplayImage(product, colorOpts) || product.imageUrl;
  const hoverImage = getHoverDisplayImage(product, colorOpts);
  const hoverImageUrl = hoverImage ? getImageUrl(hoverImage) : null;
  const primaryImageUrl = displayImage ? getImageUrl(displayImage) : null;
  const showHoverSwap = Boolean(
    hoverImageUrl && primaryImageUrl && hoverImageUrl !== primaryImageUrl
  );
  const { containerRef, revealed: hoverRevealed, imageSwapHandlers } =
    useHoverImageReveal(showHoverSwap);
  const { addItem } = useCart();
  const { showAddToCart } = useOrderNotification();
  const { isFrench } = useLanguage();
  const t = getProductTranslations(isFrench);
  const displayName = getProductDisplayName(product, isFrench);
  const router = useRouter();
  const soldInquiryHref = getSoldInquiryHref({
    slug: product.slug,
    name: displayName,
    sku: product.SKU,
  });

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProductSoldOut(product)) return;

    // Only require size selection when the product actually has sizes
    if (productHasSizes(product)) {
      setIsQuickViewOpen(true);
      return;
    }

    if (isProductSoldOut(product, selectedVariant) || isColorSold(product, selectedColor)) return;

    try {
      const cartPrice = selectedVariant
        ? getVariantPrice(selectedVariant, product)
        : selectedColor && product.hasVariants
          ? getColorPrice(product, selectedColor) ?? product.price
          : product.price;
      const cartImage =
        getPrimaryDisplayImage(product, {
          selectedColor: selectedColor || undefined,
          selectedVariant,
        }) ||
        product.imageUrl ||
        '/placeholder-product.jpg';
      const colorFr =
        selectedVariant?.colorFr ||
        product.colorOptions?.find(
          (c) => c.name.toLowerCase() === (selectedColor || '').toLowerCase()
        )?.nameFr ||
        null;

      await addItem(
        {
          id: product.id.toString(),
          productId: product.id.toString(),
          name: product.name,
          nameFr: product.nameFr || null,
          price: cartPrice,
          image: cartImage,
          slug: product.slug,
          color: selectedColor || selectedVariant?.color || undefined,
          colorFr,
          variantId: selectedVariant?.id ? String(selectedVariant.id) : undefined,
          maxStock: getProductMaxStock(product, selectedVariant),
        },
        1
      );
      showAddToCart(displayName);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const handleSoldInquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(soldInquiryHref);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const priceLabel = useMemo(
    () =>
      formatProductPriceLabel(product, {
        isFrench,
        selectedColor: selectedColor || undefined,
      }),
    [product, selectedColor, isFrench]
  );
  const displayPrice = useMemo(() => {
    if (selectedColor && product.hasVariants) {
      return getColorPrice(product, selectedColor) ?? getListingPrice(product);
    }
    return getListingPrice(product);
  }, [product, selectedColor]);
  const compareAtPrice = useMemo(() => {
    if (selectedColor && product.hasVariants) {
      return getColorCompareAtPrice(product, selectedColor);
    }
    return toPriceNumber(product.compareAtPrice);
  }, [product, selectedColor]);

  const getCategoryEmoji = (categories?: Array<{ name: string }>) => {
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

  const getCategoryName = (categories?: Array<{ name: string }>) => {
    if (!categories || categories.length === 0) return isFrench ? 'Collection' : 'Collection';
    const rawName = categories[0].name;
    if (!isFrench) return rawName;
    const categoryMap: Record<string, string> = {
      women: 'Femmes',
      men: 'Hommes',
      accessories: 'Accessoires',
      footwear: 'Chaussures',
      jewelry: 'Bijoux',
      clothing: 'Vetements',
      shoes: 'Chaussures',
    };
    return categoryMap[rawName.toLowerCase()] ?? rawName;
  };

  const soldOut =
    Boolean(selectedColor && isColorSold(product, selectedColor)) ||
    isProductSoldOut(product, selectedVariant);
  const badge = getDisplayBadge(product, selectedColor);
  const soldLabel = isFrench ? 'Vendu' : 'Sold';

  if (variant === 'editorial') {

    return (
      <div className="group">
        <div
          ref={containerRef}
          className="relative aspect-[3/4] overflow-hidden mb-6 bg-swisse-mist dark:bg-muted"
          {...imageSwapHandlers}
        >
          <Link href={productHref} className="absolute inset-0 z-0 block">
            {primaryImageUrl ? (
              <>
                <Image
                  src={primaryImageUrl}
                  alt={displayName}
                  fill
                  className={`object-cover transition-[transform,filter,opacity] duration-700 ${
                    hoverRevealed ? 'scale-105' : ''
                  } ${soldOut ? soldPhotoClass : ''}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                {showHoverSwap && hoverImageUrl ? (
                  <Image
                    src={hoverImageUrl}
                    alt=""
                    fill
                    aria-hidden
                    className={`object-cover transition-opacity duration-500 ease-out ${
                      hoverRevealed ? 'opacity-100' : 'opacity-0'
                    } ${soldOut ? soldPhotoClass : ''}`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : null}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-swisse-mist to-swisse-canvas dark:from-muted dark:to-secondary">
                <span className="text-5xl">{getCategoryEmoji(product.categories)}</span>
              </div>
            )}
          </Link>
          {badge === 'sold' ? <SoldBadge overlay label={soldLabel} /> : null}
          {badge === 'new_arrival' && (
            <span className="absolute top-4 left-4 z-[6] bg-swisse-gold text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {isFrench ? 'Nouveaute' : 'New Arrival'}
            </span>
          )}
          <div className="absolute top-4 right-4 z-[9] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <WishlistButton productId={product.id.toString()} size="md" variant="default" />
          </div>
          {soldOut ? (
            <div className="absolute inset-x-0 bottom-0 z-[12] p-4">
              <SoldAskButton href={soldInquiryHref} label={t.askUs} onClick={handleSoldInquiry} />
            </div>
          ) : (
            <div className="absolute inset-0 z-[8] flex items-end p-6 bg-swisse-canvas/0 opacity-0 transition-opacity duration-300 group-hover:bg-swisse-canvas/20 group-hover:opacity-100 pointer-events-none">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3 bg-swisse-ink text-swisse-canvas text-[10px] font-bold uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-swisse-gold pointer-events-auto dark:bg-foreground dark:text-background dark:hover:bg-primary"
              >
                {isFrench ? 'Ajout rapide' : 'Quick Add'}
              </button>
            </div>
          )}
        </div>
        <Link href={productHref} className="block">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h3 className="text-sm uppercase tracking-wider mb-1 text-swisse-ink dark:text-foreground line-clamp-2">
                {displayName}
              </h3>
              <p className="text-xs text-swisse-ink/60 dark:text-muted-foreground">
                {getCategoryName(product.categories)}
              </p>
              {product.colorOptions && product.colorOptions.length > 1 && (
                <ColorSwatches
                  colors={product.colorOptions}
                  selectedColor={selectedColor}
                  onSelect={setSelectedColor}
                  maxVisible={4}
                />
              )}
            </div>
            <div className="shrink-0 text-right">
              <StorePriceCaption
                compareAtPrice={compareAtPrice}
                sellPrice={displayPrice}
                align="right"
              />
              <span className="text-sm font-medium text-swisse-ink dark:text-foreground">
                {priceLabel}
              </span>
            </div>
          </div>
        </Link>
        {isQuickViewOpen ? (
          <QuickViewModal
            isOpen={isQuickViewOpen}
            onClose={() => setIsQuickViewOpen(false)}
            product={product}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="group relative bg-card rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={productHref} className="block">
        <div
          ref={containerRef}
          className="aspect-square bg-muted relative overflow-hidden"
          {...imageSwapHandlers}
        >
          {primaryImageUrl ? (
            <>
              <Image
                src={primaryImageUrl}
                alt={displayName}
                fill
                className={`object-cover transition-[transform,filter] duration-500 ease-in-out ${
                  hoverRevealed ? 'scale-110' : ''
                } ${soldOut ? soldPhotoClass : ''}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {showHoverSwap && hoverImageUrl ? (
                <Image
                  src={hoverImageUrl}
                  alt=""
                  fill
                  aria-hidden
                  className={`object-cover transition-opacity duration-500 ease-out ${
                    hoverRevealed ? 'opacity-100' : 'opacity-0'
                  } ${soldOut ? soldPhotoClass : ''}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : null}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
              <span className="text-6xl">{getCategoryEmoji(product.categories)}</span>
            </div>
          )}

          {badge === 'sold' ? <SoldBadge overlay label={soldLabel} /> : null}
          {badge === 'new_arrival' && (
            <span className="absolute top-3 left-3 z-[6] bg-indigo-600 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
              {isFrench ? 'Nouveaute' : 'New Arrival'}
            </span>
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <WishlistButton productId={product.id.toString()} size="md" variant="default" />
          </div>

          {soldOut ? (
            <div className="absolute inset-x-0 bottom-0 z-[12] p-3">
              <SoldAskButton href={soldInquiryHref} label={t.askUs} onClick={handleSoldInquiry} />
            </div>
          ) : (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-card transform transition-transform duration-300 ${
                isHovered ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="flex border-t border-border">
                <button
                  type="button"
                  onClick={handleQuickView}
                  className="flex-1 py-3 px-4 flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border-r border-border"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  {isFrench ? 'Apercu rapide' : 'Quick View'}
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 flex items-center justify-center text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <ShoppingBagIcon className="w-4 h-4 mr-2" />
                  {productHasSizes(product)
                    ? isFrench
                      ? 'Choisir taille'
                      : 'Select Size'
                    : isFrench
                      ? 'Ajouter au panier'
                      : 'Add to Cart'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-1">{getCategoryName(product.categories)}</p>

          <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-2">{displayName}</h3>

          {product.colorOptions && product.colorOptions.length > 1 && (
            <div className="mb-2">
              <ColorSwatches
                colors={product.colorOptions}
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
                maxVisible={5}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground/80 mb-2">
            {isFrench ? 'Ref' : 'SKU'}: {product.SKU}
          </p>

          <div className="mb-2">
            <StorePriceCaption
              compareAtPrice={compareAtPrice}
              sellPrice={displayPrice}
            />
            <span className="text-lg font-semibold text-foreground">{priceLabel}</span>
          </div>

          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
          )}
        </div>
      </Link>
      {soldOut ? (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-swisse-ink/70 dark:text-muted-foreground">{t.askSameHint}</p>
          <SoldAskButton href={soldInquiryHref} label={t.askUs} onClick={handleSoldInquiry} />
        </div>
      ) : null}

      {isQuickViewOpen ? (
        <QuickViewModal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          product={product}
        />
      ) : null}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.variant === nextProps.variant &&
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.imageUrl === nextProps.product.imageUrl &&
    prevProps.product.hoverImageIndex === nextProps.product.hoverImageIndex &&
    prevProps.product.defaultDisplayColor === nextProps.product.defaultDisplayColor &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.priceRange?.min === nextProps.product.priceRange?.min &&
    prevProps.product.priceRange?.max === nextProps.product.priceRange?.max &&
    prevProps.product.quantity === nextProps.product.quantity &&
    prevProps.product.compareAtPrice === nextProps.product.compareAtPrice &&
    prevProps.product.stockInfo?.isInStock === nextProps.product.stockInfo?.isInStock &&
    prevProps.product.displayBadge === nextProps.product.displayBadge &&
    prevProps.product.colorOptions === nextProps.product.colorOptions &&
    prevProps.product.createdAt === nextProps.product.createdAt &&
    prevProps.product.updatedAt === nextProps.product.updatedAt
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
