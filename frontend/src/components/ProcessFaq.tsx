'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';

type FaqItem = {
  question: { en: string; fr: string };
  answer: { en: string; fr: string };
};

const FAQS: FaqItem[] = [
  {
    question: {
      en: 'How do I order a piece?',
      fr: 'Comment commander une pièce ?',
    },
    answer: {
      en: 'Browse and choose the collection you want, then place your order on the website. Our support team will call you to confirm the details and clear everything with you before the piece is reserved.',
      fr: 'Parcourez et choisissez la collection que vous souhaitez, puis passez commande sur le site. Notre équipe support vous appellera pour confirmer les détails et tout clarifier avec vous avant que la pièce ne soit réservée.',
    },
  },
  {
    question: {
      en: 'How does cash on delivery work?',
      fr: 'Comment fonctionne le paiement à la livraison ?',
    },
    answer: {
      en: 'You pay when the package arrives at your door — in cash or by bank check. Nothing is charged at checkout.',
      fr: 'Vous payez à la réception du colis chez vous — en espèces ou par chèque bancaire. Rien n’est débité au moment de la commande.',
    },
  },
  {
    question: {
      en: 'When is my piece reserved?',
      fr: 'Quand ma pièce est-elle réservée ?',
    },
    answer: {
      en: 'Placing an order registers it as pending — the piece is not reserved yet. Save your order ID. We contact you by phone or email to confirm; only after that contact is the piece soft-reserved for you. Unconfirmed orders expire after about 24 hours.',
      fr: 'Passer commande enregistre un statut en attente — la pièce n’est pas encore réservée. Conservez votre numéro de commande. Nous vous contactons par téléphone ou e-mail pour confirmer ; ce n’est qu’après ce contact que la pièce est réservée pour vous. Les commandes non confirmées expirent environ 24 heures plus tard.',
    },
  },
  {
    question: {
      en: 'How long until delivery?',
      fr: 'Combien de temps pour la livraison ?',
    },
    answer: {
      en: 'After confirmation, your piece is prepared in Geneva, customs-cleared by our team, and delivered across Tunisia in about 5 to 7 days.',
      fr: 'Après confirmation, votre pièce est préparée à Genève, dédouanée par notre équipe, puis livrée partout en Tunisie en environ 5 à 7 jours.',
    },
  },
  {
    question: {
      en: 'What does shipping cost?',
      fr: 'Quel est le coût de la livraison ?',
    },
    answer: {
      en: 'Shipping is free. The price you see is the price you pay — in Tunisian dinar (TND), with VAT and customs included. No hidden fees at the door.',
      fr: 'La livraison est gratuite. Le prix affiché est le prix que vous payez — en dinar tunisien (TND), TVA et douane incluses. Aucun frais caché à la porte.',
    },
  },
  {
    question: {
      en: 'What if I miss or refuse delivery?',
      fr: 'Et si je rate ou refuse la livraison ?',
    },
    answer: {
      en: 'If you miss or refuse delivery, contact support right away — by email at admin@swisia.store, or through the phone number that confirmed your order with you — so we can rearrange delivery.',
      fr: 'Si vous ratez ou refusez la livraison, contactez immédiatement le support — par e-mail à admin@swisia.store, ou via le numéro qui a confirmé votre commande avec vous — afin que nous puissions réorganiser la livraison.',
    },
  },
];
export default function ProcessFaq() {
  const { isFrench } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="process-faq"
      aria-labelledby="process-faq-heading"
      className="overflow-x-hidden bg-swisse-linen py-20 md:py-28 dark:bg-muted/20"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center md:mb-14"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-swisse-gold sm:text-[11px]">
            {isFrench ? 'Processus' : 'Process'}
          </p>
          <h2
            id="process-faq-heading"
            className="mt-2 font-serif text-3xl leading-tight text-balance text-swisse-ink dark:text-foreground sm:text-4xl md:text-5xl"
          >
            {isFrench ? 'Comment fonctionne votre pièce' : 'How your piece works'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-swisse-ink/65 dark:text-foreground/65">
            {isFrench
              ? 'De la commande au paiement à la livraison — ce qu’il faut savoir avant de réserver une pièce Swisia.'
              : 'From order to payment on delivery — what to know before you reserve a Swisia piece.'}
          </p>
        </motion.div>

        <div className="border-y border-swisse-gold/20 dark:border-border">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const question = isFrench ? faq.question.fr : faq.question.en;
            const answer = isFrench ? faq.answer.fr : faq.answer.en;
            const panelId = `process-faq-panel-${index}`;
            const buttonId = `process-faq-button-${index}`;

            return (
              <div
                key={faq.question.en}
                className={
                  index > 0
                    ? 'border-t border-swisse-gold/20 dark:border-border'
                    : undefined
                }
              >
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-swisse-gold sm:py-6"
                >
                  <span className="font-serif text-lg text-swisse-ink dark:text-foreground sm:text-xl">
                    {question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-swisse-gold/70 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="pb-5 sm:pb-6"
                  >
                    <p className="max-w-2xl text-sm leading-relaxed text-swisse-ink/70 dark:text-foreground/70 sm:text-base">
                      {answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
