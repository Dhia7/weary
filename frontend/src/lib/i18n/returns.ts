const EN = {
  title: 'Delivery & Returns',
  subtitle:
    'Swisia pieces are confirmed by our support team and paid on delivery. If something goes wrong at the door, contact us so we can rearrange — there is no self-serve return portal.',
  missRefuseHeading: 'If you miss or refuse delivery',
  important: 'Important',
  importantBody:
    'Pieces are reserved only after support confirms your order by phone. Shipping is free across Tunisia (about 5–7 days after confirmation). Changes, refusals, and delivery issues are handled case by case — email admin@swisia.store or the number that confirmed your order. We do not publish a public phone line for returns.',
  needChange: 'Need to change something?',
  needChangeBody:
    'Because each piece is confirmed with you personally, size, collection, or address changes are arranged with support — not through an automated exchange form. Contact us before or after delivery and we will guide you.',
  reachOut: 'Reach out',
  reachOutBody: 'Email support or the number that confirmed your order',
  explainChange: 'Explain the change',
  explainChangeBody: 'Collection, delivery window, address, or refusal follow-up',
  confirmNext: 'We confirm next steps',
  confirmNextBody: 'Support clears the details with you before anything is final',
  questionsDelivery: 'Questions about delivery?',
  questionsDeliveryBody: 'Our team is here to help — use the contact form or email admin@swisia.store.',
  contactSupport: 'Contact Support',
  highlights: [
    {
      title: 'Support confirms first',
      description:
        'After you order a collection, our team calls you to confirm details before the piece is reserved.',
    },
    {
      title: 'Pay on delivery',
      description:
        'Pay at the door in cash or by bank check. Nothing is charged when you place the order.',
    },
    {
      title: 'Free shipping',
      description:
        'Delivery is free. The price you see is what you pay — in TND.',
    },
    {
      title: 'Missed delivery? Contact us',
      description:
        'If you miss or refuse delivery, reach support so we can rearrange — do not leave it unresolved.',
    },
  ],
  steps: [
    {
      title: 'Contact support',
      description: 'Tell us what happened as soon as you can.',
      details: [
        'Email admin@swisia.store',
        'Or use the phone number that confirmed your order with you',
        'Include your order ID if you have it',
        'An account is recommended so you can follow your orders',
      ],
    },
    {
      title: 'We clear the details',
      description: 'Our team reviews the situation with you.',
      details: [
        'Missed delivery — we rearrange a new drop-off',
        'Refused delivery — we discuss next steps with you',
        'Wrong details — we update address or landmark when possible',
      ],
    },
    {
      title: 'Resolution',
      description: 'We confirm the outcome before anything moves again.',
      details: [
        'A new delivery window when possible',
        'Order update by phone or email',
        'No prepaid return labels — everything goes through support',
      ],
    },
  ],
} as const;

const FR = {
  title: 'Livraison & retours',
  subtitle:
    'Les pièces Swisia sont confirmées par notre équipe support et payées à la livraison. Si quelque chose se passe mal à la porte, contactez-nous pour réorganiser — il n’y a pas de portail de retour en libre-service.',
  missRefuseHeading: 'Si vous ratez ou refusez la livraison',
  important: 'Important',
  importantBody:
    'Les pièces ne sont réservées qu’après confirmation téléphonique par le support. La livraison est gratuite partout en Tunisie (environ 5–7 jours après confirmation). Modifications, refus et problèmes de livraison sont traités au cas par cas — écrivez à admin@swisia.store ou au numéro qui a confirmé votre commande. Nous ne publions pas de ligne téléphonique publique pour les retours.',
  needChange: 'Besoin de modifier quelque chose ?',
  needChangeBody:
    'Chaque pièce étant confirmée avec vous personnellement, les changements de taille, de collection ou d’adresse se font avec le support — pas via un formulaire d’échange automatisé. Contactez-nous avant ou après la livraison et nous vous guiderons.',
  reachOut: 'Nous contacter',
  reachOutBody: 'Écrivez au support ou au numéro qui a confirmé votre commande',
  explainChange: 'Expliquer le changement',
  explainChangeBody: 'Collection, créneau de livraison, adresse, ou suite après un refus',
  confirmNext: 'Nous confirmons la suite',
  confirmNextBody: 'Le support clarifie les détails avec vous avant toute décision finale',
  questionsDelivery: 'Des questions sur la livraison ?',
  questionsDeliveryBody:
    'Notre équipe est là pour vous aider — utilisez le formulaire de contact ou écrivez à admin@swisia.store.',
  contactSupport: 'Contacter le support',
  highlights: [
    {
      title: 'Le support confirme d’abord',
      description:
        'Après votre commande, notre équipe vous appelle pour confirmer les détails avant de réserver la pièce.',
    },
    {
      title: 'Paiement à la livraison',
      description:
        'Payez à la porte en espèces ou par chèque bancaire. Rien n’est débité à la commande.',
    },
    {
      title: 'Livraison gratuite',
      description:
        'La livraison est gratuite. Le prix affiché est le prix payé — en TND.',
    },
    {
      title: 'Livraison manquée ? Contactez-nous',
      description:
        'Si vous ratez ou refusez la livraison, contactez le support pour réorganiser — ne laissez pas la situation en suspens.',
    },
  ],
  steps: [
    {
      title: 'Contacter le support',
      description: 'Dites-nous ce qui s’est passé dès que possible.',
      details: [
        'E-mail admin@swisia.store',
        'Ou le numéro qui a confirmé votre commande avec vous',
        'Indiquez votre numéro de commande si vous l’avez',
        'Un compte est recommandé pour suivre vos commandes',
      ],
    },
    {
      title: 'Nous clarifions les détails',
      description: 'Notre équipe examine la situation avec vous.',
      details: [
        'Livraison manquée — nous réorganisons un nouveau passage',
        'Livraison refusée — nous discutons de la suite avec vous',
        'Mauvais détails — nous mettons à jour l’adresse ou le point de repère si possible',
      ],
    },
    {
      title: 'Résolution',
      description: 'Nous confirmons le résultat avant toute nouvelle étape.',
      details: [
        'Un nouveau créneau de livraison lorsque c’est possible',
        'Mise à jour de la commande par téléphone ou e-mail',
        'Pas d’étiquettes de retour prépayées — tout passe par le support',
      ],
    },
  ],
} as const;

export type ReturnsTranslations = typeof EN | typeof FR;

export function getReturnsTranslations(isFrench: boolean): ReturnsTranslations {
  return isFrench ? FR : EN;
}
