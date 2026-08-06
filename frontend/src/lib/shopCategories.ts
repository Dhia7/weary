export type ShopCategoryLink = {
  slug: string;
  href: string;
  hrefFr: string;
  name: string;
  nameFr: string;
};

/** Shared shop categories for footer + navbar Shop toggle. */
export const SHOP_CATEGORIES: ShopCategoryLink[] = [
  {
    slug: 'totes',
    href: '/category/totes',
    hrefFr: '/categorie/cabas',
    name: 'Totes',
    nameFr: 'Cabas',
  },
  {
    slug: 'handbags',
    href: '/category/handbags',
    hrefFr: '/categorie/sacs-a-main',
    name: 'Handbags',
    nameFr: 'Sacs à main',
  },
  {
    slug: 'crossbody-bags',
    href: '/category/crossbody-bags',
    hrefFr: '/categorie/sacs-bandouliere',
    name: 'Crossbody bags',
    nameFr: 'Sacs bandoulière',
  },
  {
    slug: 'clutches',
    href: '/category/clutches',
    hrefFr: '/categorie/pochettes',
    name: 'Clutches',
    nameFr: 'Pochettes',
  },
  {
    slug: 'travel-bags',
    href: '/category/travel-bags',
    hrefFr: '/categorie/sacs-de-voyage',
    name: 'Travel bags',
    nameFr: 'Sacs de voyage',
  },
];
