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
      className="relative z-20 mb-6 inline-flex w-full max-w-full flex-row items-stretch border border-swisse-gold/35 bg-swisse-canvas shadow-[0_8px_30px_rgba(45,36,22,0.12)] dark:border-swisse-gold/40 dark:bg-swisse-ink/90 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:w-auto"
    >
      <span className="flex shrink-0 items-center justify-center px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-swisse-canvas bg-swisse-ink dark:bg-swisse-gold dark:text-swisse-ink sm:px-4 sm:text-[10px] sm:tracking-[0.2em]">
        CH
      </span>
      <span className="min-w-0 px-3 py-2.5 text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-swisse-ink dark:text-swisse-gold whitespace-normal sm:px-5 sm:leading-relaxed sm:tracking-[0.22em] lg:whitespace-nowrap">
        {isFrench
          ? 'Importation Officielle · Suisse → Tunisie'
          : 'Official Import · Switzerland → Tunisia'}
      </span>
    </motion.div>
  );
}
