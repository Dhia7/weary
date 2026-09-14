const EN = {
  title: 'Contact Us',
  subtitle: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
  getInTouch: 'Get in Touch',
  email: 'Email',
  responsePromise: 'We reply within 24 hours on business days.',
  instagram: 'Instagram',
  instagramHint: 'Message us about sold pieces and sourcing.',
  topicsTitle: 'Write to us about',
  topics: [
    'An order or delivery',
    'A sold unique piece',
    'A return or exchange',
    'A question about a listing',
  ],
  useForm: 'Or use the form on the right.',
  useFormMobile: 'Or use the form below.',
  name: 'Name',
  phone: 'Phone (optional)',
  phoneHint: 'Leave a number if you prefer we call you back.',
  soldInquiryBanner: (name: string) =>
    `You are asking about “${name}”, a unique piece that has been sold. Tell us what you are looking for — we will reply if we can source another.`,
  soldInquirySubject: (name: string, sku?: string | null) =>
    sku ? `Looking for: ${name} (${sku})` : `Looking for: ${name}`,
  soldInquiryMessage: (name: string, sku: string | null | undefined, listingPath: string) =>
    `Hello,\n\nI am looking for the same model or a similar unique piece to “${name}”${sku ? ` (SKU ${sku})` : ''}.\nListing: ${listingPath}\n\nPlease let me know if you can source another.\n\nThank you.`,
  phoneLine: (phone: string) => `Phone: ${phone}`,
  subject: 'Subject',
  message: 'Message',
  sending: 'Sending...',
  messageSent: 'Message Sent',
  sendMessage: 'Send Message',
  thankYou: 'Thank you! Your message was sent successfully.',
  willContact: (email: string) =>
    `Our team will contact you at ${email} as soon as possible.`,
  confirmationSent: ' We also sent a confirmation to that email address.',
  sendAnother: 'Send another message',
  failedDefault: 'Failed to send message. Please try again.',
  failedLater: 'Failed to send message. Please try again later.',
} as const;

const FR = {
  title: 'Nous contacter',
  subtitle:
    'Nous serions ravis d’avoir de vos nouvelles. Envoyez-nous un message et nous vous répondrons dès que possible.',
  getInTouch: 'Restons en contact',
  email: 'E-mail',
  responsePromise: 'Réponse sous 24 h (jours ouvrés).',
  instagram: 'Instagram',
  instagramHint: 'Écrivez-nous en DM pour une pièce vendue ou un sourçage.',
  topicsTitle: 'Écrivez-nous pour',
  topics: [
    'Une commande ou une livraison',
    'Une pièce unique vendue',
    'Un retour ou un échange',
    'Une question sur une fiche',
  ],
  useForm: 'Ou utilisez le formulaire ci-contre.',
  useFormMobile: 'Ou utilisez le formulaire ci-dessous.',
  name: 'Nom',
  phone: 'Téléphone (optionnel)',
  phoneHint: 'Laissez un numéro si vous préférez que nous vous rappelions.',
  soldInquiryBanner: (name: string) =>
    `Vous demandez « ${name} », une pièce unique déjà vendue. Dites-nous ce que vous cherchez — nous vous dirons si nous pouvons en trouver une autre.`,
  soldInquirySubject: (name: string, sku?: string | null) =>
    sku ? `Recherche : ${name} (${sku})` : `Recherche : ${name}`,
  soldInquiryMessage: (name: string, sku: string | null | undefined, listingPath: string) =>
    `Bonjour,\n\nJe cherche le même modèle ou une pièce unique similaire à « ${name} »${sku ? ` (réf. ${sku})` : ''}.\nFiche : ${listingPath}\n\nMerci de me dire si vous pouvez en sourcer une autre.\n\nCordialement,`,
  phoneLine: (phone: string) => `Téléphone : ${phone}`,
  subject: 'Sujet',
  message: 'Message',
  sending: 'Envoi…',
  messageSent: 'Message envoyé',
  sendMessage: 'Envoyer le message',
  thankYou: 'Merci ! Votre message a bien été envoyé.',
  willContact: (email: string) =>
    `Notre équipe vous contactera à ${email} dès que possible.`,
  confirmationSent: ' Nous avons aussi envoyé une confirmation à cette adresse e-mail.',
  sendAnother: 'Envoyer un autre message',
  failedDefault: 'Échec de l’envoi. Veuillez réessayer.',
  failedLater: 'Échec de l’envoi. Veuillez réessayer plus tard.',
} as const;

export type ContactTranslations = typeof EN | typeof FR;

export function getContactTranslations(isFrench: boolean): ContactTranslations {
  return isFrench ? FR : EN;
}
