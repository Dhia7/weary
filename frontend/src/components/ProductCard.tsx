'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/lib/contexts/CartContext';
import { getImageUrl } from '@/lib/utils';
import WishlistButton from './WishlistButton';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { Product, ProductDisplayBadge } from '@/lib/types/product';
import {
  formatProductPriceLabel,
  getColorPrice,
  getListingPrice,
  getProductHref,
  getProductMaxStock,
  isProductSoldOut,
  resolveProductColor,
  shouldShowCompareAtPrice,
  toPriceNumber,
} from '@/lib/types/product';
import ColorSwatches from '@/components/ColorSwatches';
import { getPrimaryDisplayImage } from '@/lib/utils/productImages';
import { getProductDisplayName } from '@/lib/i18n/product';

const QuickViewModal = dynamic(() => import('./QuickViewModal'), { ssr: false });

export type ProductCardVariant = 'default' | 'editorial';

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
}

function getDisplayBadge(product: Product): ProductDisplayBadge {
  return product.displayBadge ?? null;
}

const ProductCard = memo(({ product, variant = 'default' }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(() => resolveProductColor(product));

  useEffect(() => {
    setSelectedColor(resolveProductColor(product));
  }, [product.id, product.colorOptions, product.defaultDisplayColor]);

  const productHref = getProductHref(product.slug, selectedColor || undefined);
  const displayImage =
    getPrimaryDisplayImage(product, { selectedColor: selectedColor || undefined }) ||
    product.imageUrl;
  const { addItem } = useCart();
  const { showAddToCart } = useOrderNotification();
  const { isFrench } = useLanguage();
  const displayName = getProductDisplayName(product, isFrench);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProductSoldOut(product)) return;

    if (
      (product.hasVariants && product.colorOptions?.length) ||
      (product.size && product.size.trim().length > 0)
    ) {
      setIsQuickViewOpen(true);
      return;
    }

    try {
      await addItem(
        {
          id: product.id.toString(),
          productId: product.id.toString(),
          name: product.name,
          nameFr: product.nameFr || null,
          price: product.price,
          image: product.imageUrl || '/placeholder-product.jpg',
          slug: product.slug,
          maxStock: getProductMaxStock(product),
        },
        1
      );
      showAddToCart(displayName);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
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
  const showCompareAt = useMemo(() => {
    const hasColorSpecificPrice =
      Boolean(
        selectedColor &&
          product.hasVariants &&
          getColorPrice(product, selectedColor) != null
      );
    if (product.priceRange?.hasVariablePricing && !hasColorSpecificPrice) {
      return false;
    }
    return shouldShowCompareAtPrice(product.compareAtPrice, displayPrice);
  }, [product, selectedColor, displayPrice]);

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

  const soldOut = isProductSoldOut(product);
  const inStock = !soldOut;

  if (variant === 'editorial') {
    const badge = getDisplayBadge(product);

    return (
      <div className="group">
        <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-swisse-mist dark:bg-muted">
          <Link href={productHref} className="absolute inset-0 z-0 block">
            {displayImage ? (
              <Image
                src={getImageUrl(displayImage) || ''}
                alt={displayName}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-swisse-mist to-swisse-canvas dark:from-muted dark:to-secondary">
                <span className="text-5xl">{getCategoryEmoji(product.categories)}</span>
              </div>
            )}
          </Link>
          {badge === 'new_arrival' && (
            <span className="absolute top-4 left-4 z-[6] bg-swisse-gold text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {isFrench ? 'Nouveaute' : 'New Arrival'}
            </span>
          )}
          {badge === 'sold' && (
            <span className="absolute top-4 left-4 z-[6] bg-swisse-ink/90 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider dark:bg-foreground/90 dark:text-background">
              {isFrench ? 'Vendu' : 'Sold'}
            </span>
          )}
          <div className="absolute top-4 right-4 z-[9] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <WishlistButton productId={product.id.toString()} size="md" variant="default" />
          </div>
          <div className="absolute inset-0 z-[8] flex items-end p-6 bg-swisse-canvas/0 opacity-0 transition-opacity duration-300 group-hover:bg-swisse-canvas/20 group-hover:opacity-100 pointer-events-none">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full py-3 bg-swisse-ink text-swisse-canvas text-[10px] font-bold uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-swisse-gold pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed dark:bg-foreground dark:text-background dark:hover:bg-primary"
            >
              {inStock ? (isFrench ? 'Ajout rapide' : 'Quick Add') : (isFrench ? 'Rupture de stock' : 'Out of Stock')}
            </button>
          </div>
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
              <span className="text-sm font-medium text-swisse-ink dark:text-foreground">
                {priceLabel}
              </span>
              {showCompareAt && (
                <p className="text-xs text-swisse-ink/50 line-through dark:text-muted-foreground">
                  {`${toPriceNumber(product.compareAtPrice)!.toFixed(2)} TND`}
                </p>
              )}
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
        <div className="aspect-square bg-muted relative overflow-hidden">
          {displayImage ? (
            <Image
              src={getImageUrl(displayImage) || ''}
              alt={displayName}
              fill
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
              <span className="text-6xl">{getCategoryEmoji(product.categories)}</span>
            </div>
          )}

          {getDisplayBadge(product) === 'sold' && (
            <span className="absolute top-3 left-3 z-[6] bg-gray-900/90 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider dark:bg-foreground/90 dark:text-background">
              {isFrench ? 'Vendu' : 'Sold'}
            </span>
          )}
          {getDisplayBadge(product) === 'new_arrival' && (
            <span className="absolute top-3 left-3 z-[6] bg-indigo-600 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
              {isFrench ? 'Nouveaute' : 'New Arrival'}
            </span>
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <WishlistButton productId={product.id.toString()} size="md" variant="default" />
          </div>

          <div
            className={`absolute bottom-0 left-0 right-0 bg-card transform transition-transform duration-300 ${
              isHovered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="flex border-t border-border">
              <button
                type="button"
                onClick={handleQuickView}
                disabled={soldOut}
                className="flex-1 py-3 px-4 flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border-r border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                {isFrench ? 'Apercu rapide' : 'Quick View'}
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 py-3 px-4 flex items-center justify-center text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBagIcon className="w-4 h-4 mr-2" />
                {!inStock
                  ? isFrench
                    ? 'Rupture de stock'
                    : 'Out of Stock'
                  : (product.hasVariants && product.colorOptions?.length) ||
                    (product.size && product.size.trim().length > 0)
                    ? isFrench
                      ? 'Choisir taille'
                      : 'Select Size'
                    : isFrench
                      ? 'Ajouter au panier'
                      : 'Add to Cart'}
              </button>
            </div>
          </div>
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

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-foreground">{priceLabel}</span>
              {showCompareAt && (
                <span className="text-sm text-muted-foreground line-through">
                  {`${toPriceNumber(product.compareAtPrice)!.toFixed(2)} TND`}
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          )}
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
}, (prevProps, nextProps) => {
  return (
    prevProps.variant === nextProps.variant &&
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.imageUrl === nextProps.product.imageUrl &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.priceRange?.min === nextProps.product.priceRange?.min &&
    prevProps.product.priceRange?.max === nextProps.product.priceRange?.max &&
    prevProps.product.quantity === nextProps.product.quantity &&
    prevProps.product.compareAtPrice === nextProps.product.compareAtPrice &&
    prevProps.product.stockInfo?.status === nextProps.product.stockInfo?.status &&
    prevProps.product.displayBadge === nextProps.product.displayBadge &&
    prevProps.product.createdAt === nextProps.product.createdAt
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
