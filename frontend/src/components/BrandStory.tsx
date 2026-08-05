'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import DeliveryRouteMap from '@/components/DeliveryRouteMap';

export default function BrandStory() {
  const { isFrench } = useLanguage();

  return (
    <section id="brand-story" className="overflow-x-hidden bg-swisse-linen py-24 md:py-40">
      <div className="mx-auto max-w-swisse px-6 md:px-8">
        <div className="grid grid-cols-1 items-center gap-14 sm:gap-16 lg:grid-cols-2 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative pb-8 sm:pb-10 md:pb-8"
          >
            <div className="pointer-events-none absolute -left-6 -top-6 hidden h-28 w-28 border-l border-t border-swisse-gold/30 sm:block md:-left-10 md:-top-10 md:h-40 md:w-40" />
            <DeliveryRouteMap />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className="text-swisse-gold text-xs uppercase tracking-widest mb-6 block font-bold">
              {isFrench ? 'Comment ça marche' : 'How it works'}
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-swisse-ink mb-8 leading-tight">
              {isFrench ? 'De Suisse à Tunis, Sans Compromis' : 'From Switzerland to Tunisia, No Compromise'}
            </h2>
            <p className="text-lg text-swisse-ink/70 mb-8 leading-relaxed">
              {isFrench
                ? "Swisia travaille en direct avec des ateliers suisses certifies, sans intermediaire. Chaque commande est preparee a Geneve, dedouanee par nos soins, puis livree chez vous en Tunisie en moins d'une semaine."
                : 'Swisia works directly with certified Swiss ateliers, with no middlemen. Every order is prepared in Geneva, customs-cleared by our team, and delivered to your door in Tunisia in under one week.'}
            </p>
            <p className="text-lg text-swisse-ink/70 mb-12">
              {isFrench
                ? 'Nos prix sont affiches en dinar tunisien (TND), avec TVA et frais de douane inclus. Ce que vous voyez est exactement ce que vous payez: une experience premium, claire et sans surprise.'
                : 'Our prices are displayed in Tunisian dinar (TND), with VAT and customs duties included. What you see is exactly what you pay: a premium, transparent experience with no surprises.'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div>
                <h3 className="text-swisse-gold font-serif text-xl md:text-2xl mb-2">
                  01
                </h3>
                <p className="text-xs text-swisse-ink/65 uppercase tracking-widest">
                  {isFrench
                    ? 'Commandez en ligne : sélectionnez vos pièces, puis payez à la livraison à la réception de votre commande.'
                    : 'Order online: select your pieces, then pay cash on delivery when your order arrives.'}
                </p>
              </div>
              <div>
                <h3 className="text-swisse-gold font-serif text-xl md:text-2xl mb-2">
                  02
                </h3>
                <p className="text-xs text-swisse-ink/65 uppercase tracking-widest">
                  {isFrench
                    ? 'Expédition depuis Genève Votre colis est préparé et expédié sous 48h ouvrées, douane incluse.'
                    : 'Shipping from Geneva: your package is prepared and dispatched within 48 business hours, customs included.'}
                </p>
              </div>
              <div>
                <h3 className="text-swisse-gold font-serif text-xl md:text-2xl mb-2">
                  03
                </h3>
                <p className="text-xs text-swisse-ink/65 uppercase tracking-widest">
                  {isFrench
                    ? 'Livraison à domicile en Tunisie Réception en 5 à 7 jours dans toute la Tunisie, emballage signature inclus.'
                    : 'Home delivery in Tunisia: receive your order in 5 to 7 days across Tunisia, with signature packaging included.'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
