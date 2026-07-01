'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { HOME_IMAGES } from '@/lib/homeImages';

export default function BrandStory() {
  const { isFrench } = useLanguage();

  return (
    <section id="brand-story" className="py-24 md:py-40 bg-swisse-linen overflow-hidden">
      <div className="max-w-swisse mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-32 h-32 md:w-40 md:h-40 border-l border-t border-swisse-gold/30" />
            <div className="relative z-10">
              <Image
                src={HOME_IMAGES.brandStory}
                alt={isFrench ? 'Savoir-faire Swisia' : 'Swisia craftsmanship'}
                width={900}
                height={1100}
                className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-1000"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 px-8 py-6 md:px-12 md:py-8 bg-swisse-gold text-white font-serif text-lg md:text-xl z-20 shadow-xl">
              {isFrench ? 'Heritage de qualite' : 'Legacy of Quality'}
            </div>
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
                  {isFrench ? '01' : '01'}
                </h3>
                <p className="text-xs text-swisse-ink/65 uppercase tracking-widest">
                  {isFrench
                    ? 'Commandez en ligne Sélectionnez vos pièces, payez à la livraison (payez à la réception de votre commande) ou par carte/virement.'
                    : 'Order online: select your pieces, then pay on delivery (upon receipt of your order) or by card/bank transfer.'}
                </p>
              </div>
              <div>
                <h3 className="text-swisse-gold font-serif text-xl md:text-2xl mb-2">
                  {isFrench ? '02' : '02'}
                </h3>
                <p className="text-xs text-swisse-ink/65 uppercase tracking-widest">
                  {isFrench
                    ? 'Expédition depuis Genève Votre colis est préparé et expédié sous 48h ouvrées, douane incluse.'
                    : 'Shipping from Geneva: your package is prepared and dispatched within 48 business hours, customs included.'}
                </p>
              </div>
              <div>
                <h3 className="text-swisse-gold font-serif text-xl md:text-2xl mb-2">
                  {isFrench ? '03' : '03'}
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
