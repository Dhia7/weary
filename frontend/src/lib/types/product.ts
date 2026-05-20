export interface ProductVariant {
  id: number;
  productId?: number;
  SKU: string;
  color: string;
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

export const getProductMaxStock = (
  product: Pick<Product, 'quantity' | 'size' | 'stockInfo'>,
  variant?: ProductVariant
): number => {
  if (variant) {
    return variant.stockInfo?.quantity ?? variant.quantity ?? 0;
  }
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

/** Listing / card label when variants have different prices */
export const formatProductPriceLabel = (
  product: Product,
  options?: { selectedVariant?: ProductVariant; isFrench?: boolean }
): string => {
  if (options?.selectedVariant) {
    return formatPriceTnd(getVariantPrice(options.selectedVariant, product));
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
