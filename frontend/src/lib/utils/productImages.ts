import type { Product, ProductVariant } from '@/lib/types/product';

/** Minimal variant fields used for per-color image helpers */
export type VariantImagesRow = {
  color: string;
  imageUrl?: string | null;
  images?: string[] | null;
  colorHex?: string | null;
};

/** Order product gallery with main thumbnail first */
export function orderProductImages(
  images: string[] | undefined | null,
  mainThumbnailIndex = 0
): string[] {
  if (!images?.length) return [];
  const clamped = Math.max(0, Math.min(mainThumbnailIndex, images.length - 1));
  if (clamped === 0) return [...images];
  const main = images[clamped];
  return [main, ...images.filter((_, i) => i !== clamped)];
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Collect image URLs from variant rows matching a color */
export function getVariantImagesForColor(
  variants: VariantImagesRow[] | undefined | null,
  colorName: string
): string[] {
  if (!variants?.length || !colorName.trim()) return [];

  const normalized = colorName.trim().toLowerCase();
  const urls: string[] = [];

  for (const v of variants) {
    if (v.color.trim().toLowerCase() !== normalized) continue;
    if (v.imageUrl) urls.push(v.imageUrl);
    if (Array.isArray(v.images)) urls.push(...v.images);
  }

  return uniqueUrls(urls);
}

/** Collect image URLs from all variants of a given color on a product */
export function getImagesForColor(product: Product, colorName: string): string[] {
  return getVariantImagesForColor(product.variants, colorName);
}

function variantImageList(variant: VariantImagesRow): string[] {
  const list: string[] = [];
  if (variant.imageUrl) list.push(variant.imageUrl);
  if (Array.isArray(variant.images)) list.push(...variant.images);
  return uniqueUrls(list);
}

export interface DisplayImageOptions {
  selectedColor?: string;
  selectedVariant?: ProductVariant;
}

/**
 * Images to show in the gallery: variant → color variants → product default gallery.
 */
export function getProductDisplayImages(
  product: Product | null | undefined,
  options: DisplayImageOptions = {}
): string[] {
  if (!product) return [];

  const { selectedColor, selectedVariant } = options;

  if (selectedVariant) {
    const variantImages = variantImageList(selectedVariant);
    if (variantImages.length) return variantImages;
  }

  if (selectedColor && product.hasVariants) {
    const colorImages = getImagesForColor(product, selectedColor);
    if (colorImages.length) return colorImages;
  }

  const fromProduct = orderProductImages(
    product.images,
    product.mainThumbnailIndex ?? 0
  );
  if (fromProduct.length) return fromProduct;

  return product.imageUrl ? [product.imageUrl] : [];
}

export function getPrimaryDisplayImage(
  product: Product | null | undefined,
  options: DisplayImageOptions = {},
  imageIndex = 0
): string | undefined {
  const images = getProductDisplayImages(product, options);
  if (images.length) return images[Math.min(imageIndex, images.length - 1)];
  return product?.imageUrl;
}

/** Unique color names from variants (preserves first-seen order) */
export function getUniqueVariantColors(variants: VariantImagesRow[]): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const v of variants) {
    const name = v.color?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    colors.push(name);
  }
  return colors;
}

/** Update imageUrl + images for every variant row matching a color */
export function applyImagesToColorVariants<T extends VariantImagesRow>(
  variants: T[],
  colorName: string,
  imageUrls: string[]
): T[] {
  const normalized = colorName.trim().toLowerCase();
  const cleaned = uniqueUrls(imageUrls);
  return variants.map((v) => {
    if (v.color.trim().toLowerCase() !== normalized) return v;
    return {
      ...v,
      imageUrl: cleaned[0] || null,
      images: cleaned,
    };
  });
}

export function parseImageUrlLines(text: string): string[] {
  return uniqueUrls(
    text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function imagesToUrlLines(urls: string[] | undefined | null): string {
  if (!urls?.length) return '';
  return urls.join('\n');
}

