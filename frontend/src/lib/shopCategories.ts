export type ShopCategoryLink = {
  slug: string;
  href: string;
  name: string;
  nameFr: string;
};

/** Shared shop categories for footer + navbar Shop toggle. */
export const SHOP_CATEGORIES: ShopCategoryLink[] = [
  { slug: 'totes', href: '/category/totes', name: 'Totes', nameFr: 'Cabas' },
  { slug: 'handbags', href: '/category/handbags', name: 'Handbags', nameFr: 'Sacs à main' },
  {
    slug: 'crossbody-bags',
    href: '/category/crossbody-bags',
    name: 'Crossbody bags',
    nameFr: 'Sacs bandoulière',
  },
  { slug: 'clutches', href: '/category/clutches', name: 'Clutches', nameFr: 'Pochettes' },
  {
    slug: 'travel-bags',
    href: '/category/travel-bags',
    name: 'Travel bags',
    nameFr: 'Sacs de voyage',
  },
];
