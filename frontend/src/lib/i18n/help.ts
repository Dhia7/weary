const EN = {
  title: 'Help Center',
  subtitle:
    'How Swisia orders work — from choosing a collection to payment on delivery — and how to reach support when you need us.',
  browseByTopic: 'Browse by topic',
  stillNeedHelp: 'Still need help?',
  contactUs: 'Contact Us',
  emailSupport: 'Email Support',
  deliveryReturns: 'Delivery & Returns',
  categories: [
    {
      title: 'Ordering & Payment',
      topics: [
        'Choose a collection and order on the site',
        'Support calls to confirm details',
        'Pay on delivery — cash or bank check',
        'Piece reserved only after confirmation',
      ],
      href: undefined as string | undefined,
    },
    {
      title: 'Shipping & Delivery',
      topics: [
        'Free shipping across Tunisia',
        'About 5–7 days after confirmation',
        'Prepared in Geneva by our team',
        'Price you see is what you pay (TND)',
      ],
      href: undefined as string | undefined,
    },
    {
      title: 'Delivery Issues',
      topics: [
        'Missed or refused delivery',
        'Rearrange with support',
        'Email admin@swisia.store',
        'Or the number that confirmed your order',
      ],
      href: '/returns' as string | undefined,
    },
    {
      title: 'Account & Orders',
      topics: [
        'We recommend creating an account',
        'Follow your orders in one place',
        'Save your order ID after checkout',
        'Contact support for changes',
      ],
      href: undefined as string | undefined,
    },
  ],
} as const;

const FR = {
  title: "Centre d'aide",
  subtitle:
    'Comment fonctionnent les commandes Swisia — du choix d’une collection au paiement à la livraison — et comment joindre le support quand vous en avez besoin.',
  browseByTopic: 'Parcourir par sujet',
  stillNeedHelp: 'Besoin d’aide encore ?',
  contactUs: 'Nous contacter',
  emailSupport: 'E-mail support',
  deliveryReturns: 'Livraison & retours',
  categories: [
    {
      title: 'Commande & paiement',
      topics: [
        'Choisissez une collection et commandez sur le site',
        'Le support appelle pour confirmer les détails',
        'Paiement à la livraison — espèces ou chèque bancaire',
        'Pièce réservée uniquement après confirmation',
      ],
      href: undefined as string | undefined,
    },
    {
      title: 'Livraison',
      topics: [
        'Livraison gratuite partout en Tunisie',
        'Environ 5–7 jours après confirmation',
        'Préparé à Genève par notre équipe',
        'Le prix affiché est le prix payé (TND)',
      ],
      href: undefined as string | undefined,
    },
    {
      title: 'Problèmes de livraison',
      topics: [
        'Livraison manquée ou refusée',
        'Réorganisation avec le support',
        'E-mail admin@swisia.store',
        'Ou le numéro qui a confirmé votre commande',
      ],
      href: '/returns' as string | undefined,
    },
    {
      title: 'Compte & commandes',
      topics: [
        'Nous recommandons de créer un compte',
        'Suivez vos commandes au même endroit',
        'Conservez votre numéro de commande après le checkout',
        'Contactez le support pour toute modification',
      ],
      href: undefined as string | undefined,
    },
  ],
} as const;

export type HelpTranslations = typeof EN | typeof FR;

export function getHelpTranslations(isFrench: boolean): HelpTranslations {
  return isFrench ? FR : EN;
}
