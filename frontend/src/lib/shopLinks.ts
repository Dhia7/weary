export const CONTACT_EMAIL = 'admin@swisia.store';
export const INSTAGRAM_URL = 'https://www.instagram.com/swisia.store/';
export const INSTAGRAM_HANDLE = '@swisia.store';

export function getSoldInquiryHref(product: {
  slug: string;
  name: string;
  sku?: string | null;
}): string {
  const params = new URLSearchParams({
    reason: 'sold',
    name: product.name,
    slug: product.slug,
  });
  const sku = product.sku?.trim();
  if (sku) params.set('sku', sku);
  return `/contact?${params.toString()}`;
}
