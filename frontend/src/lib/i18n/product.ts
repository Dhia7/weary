const CATEGORY_FR: Record<string, string> = {
  women: 'Femmes',
  men: 'Hommes',
  accessories: 'Accessoires',
  footwear: 'Chaussures',
  jewelry: 'Bijoux',
  clothing: 'Vêtements',
  shoes: 'Chaussures',
};

export function translateCategoryName(name: string, isFrench: boolean): string {
  if (!isFrench) return name;
  return CATEGORY_FR[name.toLowerCase()] ?? name;
}

const EN = {
  home: 'Home',
  breadcrumbAria: 'Breadcrumb',
  productNotFound: 'Product not found',
  backToHome: 'Back to Home',
  showingImagesFor: (color: string) => `Showing images for ${color}`,
  priceVariesBySize: 'Price may vary by size — select a size for the exact amount.',
  priceVariesByColor: 'Price varies by color — select a color to see your price.',
  storePrice: 'store price:',
  description: 'Description',
  descriptionFr: 'Description du produit',
  dimensions: 'Adjustment & Measurement',
  depth: 'Depth',
  width: 'Width',
  height: 'Height',
  materials: 'Materials',
  outerMaterial: 'Outer material',
  weight: 'Weight',
  color: 'Color',
  selected: (value: string) => `Selected: ${value}`,
  selectSize: 'Select Size',
  chooseSize: 'Choose your size',
  selectedSize: (size: string) => `✓ Selected: ${size}`,
  quantity: 'Quantity',
  decreaseQuantity: 'Decrease quantity',
  increaseQuantity: 'Increase quantity',
  outOfStock: 'Out of Stock',
  sold: 'Sold',
  askUs: 'Want the same piece?',
  askAboutPiece: 'Want the same piece?',
  soldInquiryTitle: 'This unique piece is sold',
  soldInquiryBody:
    'Want the same model or something close? Write to us or message us on Instagram — we will tell you if we can source another.',
  askSameHint: 'Sold. We can look for another.',
  dmInstagram: 'Message on Instagram',
  addToCart: 'Add to Cart',
  buyNow: 'Buy Now',
  payOnDelivery: 'Pay on delivery',
  payOnDeliveryDetail: '— cash or bank check',
  returns: '7-day returns',
  returnsDetail: 'for unused items',
  supportConfirms: 'Support confirms',
  supportConfirmsDetail: 'your order by phone',
  wishlistAdded: 'Added to your wishlist',
  selectColorCart: 'Please select a color before adding to cart.',
  selectSizeCart: 'Please select a size before adding to cart.',
  variantOutOfStock: 'This color/size combination is out of stock.',
  selectColorCheckout: 'Please select a color before proceeding to checkout.',
  selectSizeCheckout: 'Please select a size before proceeding to checkout.',
  selectColor: 'Please select a color.',
  selectSizeFirst: 'Select Size First',
  viewFullDetails: 'View Full Details',
  closeModal: 'Close modal',
  viewImage: (n: number) => `View image ${n}`,
  selectImage: (n: number, total: number) => `Select image ${n} of ${total}`,
} as const;

const FR = {
  home: 'Accueil',
  breadcrumbAria: "Fil d'Ariane",
  productNotFound: 'Produit introuvable',
  backToHome: "Retour à l'accueil",
  showingImagesFor: (color: string) => `Images pour ${color}`,
  priceVariesBySize:
    'Le prix peut varier selon la taille — choisissez une taille pour le montant exact.',
  priceVariesByColor:
    'Le prix varie selon la couleur — choisissez une couleur pour voir votre prix.',
  storePrice: 'prix magasin:',
  description: 'Description',
  descriptionFr: 'Description du produit',
  dimensions: 'Ajustement & mesures',
  depth: 'Profondeur',
  width: 'Largeur',
  height: 'Hauteur',
  materials: 'Matériaux',
  outerMaterial: 'Matière extérieure',
  weight: 'Poids',
  color: 'Couleur',
  selected: (value: string) => `Sélectionné : ${value}`,
  selectSize: 'Choisir la taille',
  chooseSize: 'Choisissez votre taille',
  selectedSize: (size: string) => `✓ Sélectionné : ${size}`,
  quantity: 'Quantité',
  decreaseQuantity: 'Diminuer la quantité',
  increaseQuantity: 'Augmenter la quantité',
  outOfStock: 'Rupture de stock',
  sold: 'Vendu',
  askUs: 'Vous voulez le même ?',
  askAboutPiece: 'Vous voulez le même ?',
  soldInquiryTitle: 'Cette pièce unique est vendue',
  soldInquiryBody:
    'Vous voulez le même modèle ou une pièce proche ? Écrivez-nous ou contactez-nous sur Instagram — nous vous dirons si nous pouvons en trouver une autre.',
  askSameHint: 'Vendu. Nous pouvons en chercher une autre.',
  dmInstagram: 'Écrire sur Instagram',
  addToCart: 'Ajouter au panier',
  buyNow: 'Acheter maintenant',
  payOnDelivery: 'Paiement à la livraison',
  payOnDeliveryDetail: '— espèces ou chèque bancaire',
  returns: 'Retours sous 7 jours',
  returnsDetail: 'pour les articles non utilisés',
  supportConfirms: 'Le support confirme',
  supportConfirmsDetail: 'votre commande par téléphone',
  wishlistAdded: 'Ajouté à votre liste de souhaits',
  selectColorCart: "Veuillez sélectionner une couleur avant d'ajouter au panier.",
  selectSizeCart: "Veuillez sélectionner une taille avant d'ajouter au panier.",
  variantOutOfStock: 'Cette combinaison couleur/taille est en rupture de stock.',
  selectColorCheckout: 'Veuillez sélectionner une couleur avant de passer au paiement.',
  selectSizeCheckout: 'Veuillez sélectionner une taille avant de passer au paiement.',
  selectColor: 'Veuillez sélectionner une couleur.',
  selectSizeFirst: "Choisir la taille d'abord",
  viewFullDetails: 'Voir tous les détails',
  closeModal: 'Fermer',
  viewImage: (n: number) => `Voir l'image ${n}`,
  selectImage: (n: number, total: number) => `Sélectionner l'image ${n} sur ${total}`,
} as const;

export type ProductTranslations = typeof EN | typeof FR;

export function getProductTranslations(isFrench: boolean): ProductTranslations {
  return isFrench ? FR : EN;
}

/** Storefront product title: French when available, else English. Prefixes brand if missing. */
export function getProductDisplayName(
  product: { name: string; nameFr?: string | null; brand?: string | null },
  isFrench: boolean
): string {
  const title = isFrench && product.nameFr?.trim() ? product.nameFr.trim() : product.name;
  const brand = product.brand?.trim();
  if (!brand) return title;
  if (title.toLowerCase().startsWith(brand.toLowerCase())) return title;
  return `${brand} ${title}`.trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Brand shown first in bold, then the rest of the title without repeating the brand. */
export function getProductTitleParts(
  product: { name: string; nameFr?: string | null; brand?: string | null },
  isFrench: boolean
): { brand: string | null; rest: string } {
  const title = getProductDisplayName(product, isFrench);
  const brand = product.brand?.trim() || null;
  if (!brand) return { brand: null, rest: title };
  const leading = new RegExp(`^${escapeRegExp(brand)}(?:\\s*[:\\-–—]\\s*|\\s+|$)`, 'i');
  if (!leading.test(title)) return { brand, rest: title };
  const rest = title.replace(leading, '').trim();
  return { brand, rest };
}

/** Storefront color label from a ColorOption or canonical name + options lookup. */
export function getColorDisplayName(
  color: string | { name: string; nameFr?: string | null } | null | undefined,
  isFrench: boolean,
  colorOptions?: Array<{ name: string; nameFr?: string | null }>
): string {
  if (!color) return '';
  if (typeof color === 'object') {
    if (isFrench && color.nameFr?.trim()) return color.nameFr.trim();
    return color.name;
  }
  const canonical = color.trim();
  if (!canonical) return '';
  if (isFrench && colorOptions?.length) {
    const match = colorOptions.find(
      (c) => c.name.trim().toLowerCase() === canonical.toLowerCase()
    );
    if (match?.nameFr?.trim()) return match.nameFr.trim();
  }
  return canonical;
}

