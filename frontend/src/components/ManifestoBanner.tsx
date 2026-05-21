'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function ManifestoBanner() {
  const { isFrench } = useLanguage();

  return (
    <section
      id="craftsmanship"
      className="py-16 md:py-20 bg-swisse-mist border-y border-swisse-gold/10"
    >
      <div className="max-w-swisse mx-auto px-6 md:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-serif text-2xl md:text-3xl font-normal italic text-swisse-ink/90 max-w-4xl mx-auto leading-relaxed"
        >
          {isFrench
            ? '"Nous avons supprimé les intermédiaires pour vous offrir l accès direct aux ateliers suisses — la même qualité portée à Genève, maintenant disponible à Tunis."'
            : '"We removed intermediaries to give you direct access to Swiss ateliers — the same quality worn in Geneva, now available in Tunis."'}
          {isFrench ? (
            <>
              <br />
              — Fondateur, Swissé Tunisia
            </>
          ) : (
            <>
              <br />
              — Founder, Swissé Tunisia
            </>
          )}
        </motion.p>
      </div>
    </section>
  );
}
