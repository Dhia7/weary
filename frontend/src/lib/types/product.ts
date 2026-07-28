export interface ProductVariant {
  id: number;
  productId?: number;
  SKU: string;
  color: string;
  colorFr?: string | null;
  colorCode?: string | null;
  colorHex?: string | null;
  size?: string | null;
  quantity: number;
  price?: number | null;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  images?: string[];
  isActive?: boolean;
  sortOrder?: number;
  stockInfo?: {
    quantity?: number;
    status: string;
    isInStock: boolean;
    isLowStock?: boolean;
  };
}

export interface ColorOption {
  name: string;
  nameFr?: string | null;
  hex?: string | null;
  imageUrl?: string | null;
  /** Lowest price for this color (across sizes), when variants differ */
  price?: number;
}

export interface ProductPriceRange {
  min: number;
  max: number;
  hasVariablePricing: boolean;
}

export type ProductDisplayBadge = 'new_arrival' | 'sold' | null;

export interface Product {
  id: number;
  name: string;
  nameFr?: string | null;
  slug: string;
  description: string;
  SKU: string;
  weightGrams?: number;
  depthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  outerMaterial?: string | null;
  isActive: boolean;
  displayBadge?: ProductDisplayBadge;
  allowCustomerQuantity?: boolean;
  imageUrl?: string;
  images?: string[];
  mainThumbnailIndex?: number;
  defaultDisplayColor?: string | null;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  size?: string | null;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  colorOptions?: ColorOption[];
  priceRange?: ProductPriceRange;
  availableSizes?: string[];
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

/** Sized, non-variant products with qty 0 are made-to-order unless marked sold. */
export const isMadeToOrderProduct = (
  product: Pick<Product, 'size' | 'hasVariants' | 'displayBadge'>
): boolean =>
  Boolean(
    product.size?.trim() &&
      !product.hasVariants &&
      product.displayBadge !== 'sold'
  );

/** True when the product cannot be purchased (sold badge or no stock). */
export const isProductSoldOut = (
  product: Product,
  selectedVariant?: ProductVariant
): boolean => {
  if (product.displayBadge === 'sold') return true;

  if (product.hasVariants && product.variants?.length) {
    if (selectedVariant) {
      return !(selectedVariant.stockInfo?.isInStock ?? selectedVariant.quantity > 0);
    }
    const anyInStock = product.variants.some(
      (v) => v.stockInfo?.isInStock ?? v.quantity > 0
    );
    return !(product.stockInfo?.isInStock ?? anyInStock);
  }

  if (isMadeToOrderProduct(product)) return false;

  const qty = product.stockInfo?.quantity ?? product.quantity ?? 0;
  return !(product.stockInfo?.isInStock ?? qty > 0);
};

export const getProductMaxStock = (
  product: Pick<Product, 'quantity' | 'size' | 'stockInfo' | 'hasVariants' | 'displayBadge'>,
  variant?: ProductVariant
): number => {
  if (product.displayBadge === 'sold') return 0;
  if (variant) {
    return variant.stockInfo?.quantity ?? variant.quantity ?? 0;
  }
  if (isMadeToOrderProduct(product)) return 999;
  return product.stockInfo?.quantity ?? product.quantity ?? 0;
};

export const findVariant = (
  variants: ProductVariant[] | undefined,
  color: string,
  size?: string
): ProductVariant | undefined => {
  if (!variants?.length || !color) return undefined;
  const normalizedColor = color.trim().toLowerCase();
  const normalizedSize = size?.trim();
  return variants.find((v) => {
    const colorMatch = v.color.trim().toLowerCase() === normalizedColor;
    if (!normalizedSize) {
      return colorMatch && (!v.size || !v.size.trim());
    }
    return colorMatch && (v.size || '').trim() === normalizedSize;
  });
};

export const getVariantPrice = (variant: ProductVariant | undefined, product: Product): number => {
  const base = Number(product.price);
  if (variant?.price != null) return Number(variant.price);
  if (variant?.color && product.colorOptions?.length) {
    const match = product.colorOptions.find(
      (c) => c.name.trim().toLowerCase() === variant.color.trim().toLowerCase()
    );
    if (match?.price != null) return Number(match.price);
  }
  return base;
};

export const formatPriceTnd = (price: number | string): string =>
  `${Number(price).toFixed(2)} TND`;

/** Coerce API decimal strings to a finite number, or null when absent/invalid. */
export const toPriceNumber = (
  value: number | string | null | undefined
): number | null => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Lowest price shown on listings (variant min, price range, or base price). */
export const getListingPrice = (product: Product): number => {
  const range = product.priceRange;
  if (range?.hasVariablePricing) return range.min;

  if (product.hasVariants && product.variants?.length) {
    const prices = product.variants.map((v) => getVariantPrice(v, product));
    return Math.min(...prices);
  }

  return toPriceNumber(product.price) ?? 0;
};

/** Compare-at price for the current selection (variant overrides product). */
export const getEffectiveCompareAtPrice = (
  product: Product,
  selectedVariant?: ProductVariant
): number | null =>
  toPriceNumber(selectedVariant?.compareAtPrice ?? product.compareAtPrice);

/** Show strikethrough compare-at only when it is strictly higher than the active price. */
export const shouldShowCompareAtPrice = (
  compareAt: number | string | null | undefined,
  currentPrice: number | string
): boolean => {
  const compare = toPriceNumber(compareAt);
  const current = toPriceNumber(currentPrice);
  if (compare == null || current == null) return false;
  return compare > current;
};

/** Price for a color before size is chosen (min across sizes for that color) */
export const getColorPrice = (
  product: Product,
  colorName: string
): number | undefined => {
  const option = product.colorOptions?.find(
    (c) => c.name.toLowerCase() === colorName.trim().toLowerCase()
  );
  if (option?.price != null) return option.price;
  if (!product.variants?.length) return undefined;
  const matches = product.variants.filter(
    (v) => v.color.trim().toLowerCase() === colorName.trim().toLowerCase()
  );
  if (!matches.length) return undefined;
  return Math.min(...matches.map((v) => getVariantPrice(v, product)));
};

/** Listing / card label when variants have different prices */
export const formatProductPriceLabel = (
  product: Product,
  options?: { selectedVariant?: ProductVariant; selectedColor?: string; isFrench?: boolean }
): string => {
  if (options?.selectedVariant) {
    return formatPriceTnd(getVariantPrice(options.selectedVariant, product));
  }

  if (options?.selectedColor?.trim() && product.hasVariants) {
    const colorPrice = getColorPrice(product, options.selectedColor);
    if (colorPrice != null) {
      return formatPriceTnd(colorPrice);
    }
  }

  const range = product.priceRange;
  if (range?.hasVariablePricing) {
    const from = options?.isFrench ? 'À partir de' : 'From';
    return `${from} ${formatPriceTnd(range.min)}`;
  }

  if (product.hasVariants && product.variants?.length) {
    const prices = product.variants.map((v) => getVariantPrice(v, product));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (Math.abs(min - max) > 0.001) {
      const from = options?.isFrench ? 'À partir de' : 'From';
      return `${from} ${formatPriceTnd(min)}`;
    }
  }

  return formatPriceTnd(product.price);
};

/** Match a URL/query color param to a product color option, or fall back to admin default / first. */
export const resolveProductColor = (
  product: Pick<Product, 'colorOptions' | 'defaultDisplayColor'>,
  colorParam?: string | null
): string => {
  const options = product.colorOptions;
  if (!options?.length) return '';
  if (colorParam?.trim()) {
    const match = options.find(
      (c) => c.name.trim().toLowerCase() === colorParam.trim().toLowerCase()
    );
    if (match) return match.name;
  }
  if (product.defaultDisplayColor?.trim()) {
    const match = options.find(
      (c) =>
        c.name.trim().toLowerCase() === product.defaultDisplayColor!.trim().toLowerCase()
    );
    if (match) return match.name;
  }
  return options[0]?.name || '';
};

export const getProductHref = (slug: string, color?: string | null): string => {
  const base = `/product/${slug}`;
  if (!color?.trim()) return base;
  return `${base}?color=${encodeURIComponent(color.trim())}`;
};
