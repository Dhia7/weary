'use client';

import { motion } from 'framer-motion';

type HeroAnimatedBadgeProps = {
  isFrench: boolean;
};

export default function HeroAnimatedBadge({ isFrench }: HeroAnimatedBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative z-20 mb-6 max-w-full text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-swisse-ink dark:text-swisse-canvas sm:text-[11px] sm:tracking-[0.22em]"
    >
      {isFrench
        ? 'CH · Importation Officielle · Suisse → Tunisie'
        : 'CH · Official Import · Switzerland → Tunisia'}
    </motion.div>
  );
}
