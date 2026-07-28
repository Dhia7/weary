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
  description: 'Description',
  descriptionFr: 'Description du produit',
  dimensions: 'Dimensions',
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
  addToCart: 'Add to Cart',
  buyNow: 'Buy Now',
  freeShipping: 'Free shipping',
  freeShippingDetail: 'on orders over 100 TND',
  returns: '30-day returns',
  returnsDetail: 'for unused items',
  secureCheckout: 'Secure checkout',
  secureCheckoutDetail: 'with SSL encryption',
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
  description: 'Description',
  descriptionFr: 'Description du produit',
  dimensions: 'Dimensions',
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
  addToCart: 'Ajouter au panier',
  buyNow: 'Acheter maintenant',
  freeShipping: 'Livraison gratuite',
  freeShippingDetail: 'pour les commandes de plus de 100 TND',
  returns: 'Retours sous 30 jours',
  returnsDetail: 'pour les articles non utilisés',
  secureCheckout: 'Paiement sécurisé',
  secureCheckoutDetail: 'avec chiffrement SSL',
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

/** Storefront product title: French when available, else English. */
export function getProductDisplayName(
  product: { name: string; nameFr?: string | null },
  isFrench: boolean
): string {
  if (isFrench && product.nameFr?.trim()) return product.nameFr.trim();
  return product.name;
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

