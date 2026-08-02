'use client';

import { useLanguage } from '@/lib/contexts/LanguageContext';

const ITEMS = [
  {
    fr: 'Livraison 5–7 jours',
    en: 'Delivery in 5–7 days',
  },
  {
    fr: 'Prix TND, TVA incluse',
    en: 'Prices in TND, VAT included',
  },
  {
    fr: 'Sans intermédiaires',
    en: 'No middlemen',
  },
  {
    fr: 'Paiement à la livraison',
    en: 'Cash on delivery',
  },
] as const;

export default function TrustBar() {
  const { isFrench } = useLanguage();

  return (
    <section
      aria-label={isFrench ? 'Nos garanties' : 'Our guarantees'}
      className="border-y border-swisse-gold/15 bg-swisse-mist/70 dark:bg-muted/30 dark:border-border"
    >
      <div className="max-w-swisse mx-auto px-4 sm:px-6 md:px-8">
        {/* Same 4-up row on every breakpoint */}
        <ul className="grid grid-cols-4 items-stretch py-3.5 sm:py-4 md:py-5">
          {ITEMS.map((item, index) => (
            <li
              key={item.en}
              className={`flex items-center justify-center px-1.5 sm:px-3 md:px-4 ${
                index > 0
                  ? 'border-l border-swisse-gold/35 dark:border-border'
                  : ''
              }`}
            >
              <span className="text-center text-[9px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.16em] md:tracking-[0.18em] text-swisse-ink/80 dark:text-foreground/80 leading-snug">
                {isFrench ? item.fr : item.en}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
