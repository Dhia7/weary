'use client';

import { motion } from 'framer-motion';

type HeroAnimatedBadgeProps = {
  isFrench: boolean;
};

export default function HeroAnimatedBadge({ isFrench }: HeroAnimatedBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="inline-flex max-w-full items-stretch overflow-hidden border border-[#d7cebe] bg-[#f3eee3]/95 dark:border-swisse-gold/30 dark:bg-swisse-ink/75 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.28em] mb-6 backdrop-blur-sm"
    >
      <span className="shrink-0 px-3 sm:px-4 py-2 font-medium text-swisse-ink dark:text-swisse-canvas border-r border-[#d7cebe] dark:border-swisse-gold/30 tracking-[0.2em]">
        CH
      </span>
      <span className="px-3 sm:px-5 py-2 font-semibold text-[#b39b69] dark:text-swisse-gold leading-relaxed">
        {isFrench
          ? 'Importation Officielle · Suisse → Tunisie'
          : 'Official Import · Switzerland → Tunisia'}
      </span>
    </motion.span>
  );
}
