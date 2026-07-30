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
      <div className="max-w-swisse mx-auto px-6 md:px-8">
        <ul className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-center gap-3 sm:gap-0 py-4 md:py-5">
          {ITEMS.map((item, index) => (
            <li
              key={item.en}
              className="flex items-center justify-center sm:justify-start text-center sm:text-left"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className="hidden sm:inline-block mx-5 md:mx-7 h-3 w-px bg-swisse-gold/35 dark:bg-border"
                />
              )}
              <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-swisse-ink/80 dark:text-foreground/80">
                {isFrench ? item.fr : item.en}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
