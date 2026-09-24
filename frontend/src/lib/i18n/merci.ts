const EN = {
  title: 'Thank you.',
  eyebrow: 'Your piece',
  subtitle: 'Thank you for your trust.',
  promoLabel: 'Your next order',
  promoCode: 'MERCI15',
  promoOff: '−15%',
  promoNote: 'Mention the code when we call to confirm your next order.',
  copied: 'Copied',
  copyCode: 'Copy code',
  instagramTitle: 'Instagram',
  instagramBody: 'Follow @swisia.store — tag us in your photos and stories.',
  instagramCta: 'Open Instagram',
  reviewTitle: 'Leave a review',
  reviewBody: 'A few words help the next person choose. We read every note.',
  ratingLabel: 'Rating',
  name: 'Name',
  email: 'Email',
  message: 'Your review',
  messagePlaceholder: 'How was the piece, the packing, the delivery?',
  sending: 'Sending…',
  send: 'Send review',
  success: 'Thank you — your review was sent.',
  successDetail: (email: string) =>
    `We’ll be in touch at ${email} if we need anything else.`,
  failed: 'Could not send your review. Please try again.',
  shop: 'Continue shopping',
} as const;

const FR = {
  title: 'Merci.',
  eyebrow: 'Votre pièce',
  subtitle: 'Merci de votre confiance.',
  promoLabel: 'Prochaine commande',
  promoCode: 'MERCI15',
  promoOff: '−15%',
  promoNote:
    'Mentionnez le code lorsque nous confirmons votre prochaine commande.',
  copied: 'Copié',
  copyCode: 'Copier le code',
  instagramTitle: 'Instagram',
  instagramBody:
    'Suivez @swisia.store — identifiez-nous sur vos photos et stories.',
  instagramCta: 'Ouvrir Instagram',
  reviewTitle: 'Laisser un avis',
  reviewBody:
    'Quelques mots aident la personne suivante à choisir. Nous lisons chaque message.',
  ratingLabel: 'Note',
  name: 'Nom',
  email: 'E-mail',
  message: 'Votre avis',
  messagePlaceholder: 'La pièce, l’emballage, la livraison ?',
  sending: 'Envoi…',
  send: 'Envoyer l’avis',
  success: 'Merci — votre avis a bien été envoyé.',
  successDetail: (email: string) =>
    `Nous vous écrirons à ${email} si besoin.`,
  failed: 'Impossible d’envoyer l’avis. Merci de réessayer.',
  shop: 'Voir la collection',
} as const;

export function getMerciTranslations(isFrench: boolean) {
  return isFrench ? FR : EN;
}
