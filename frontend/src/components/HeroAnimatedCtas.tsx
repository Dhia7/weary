'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { scrollToHomeSection } from '@/lib/homeSectionNavigation';

type HeroAnimatedCtasProps = {
  isFrench: boolean;
};

export default function HeroAnimatedCtas({ isFrench }: HeroAnimatedCtasProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8"
    >
      <Link
        href="/products"
        className="inline-flex justify-center px-10 py-4 bg-swisse-ink text-swisse-canvas text-xs font-bold uppercase tracking-widest hover:bg-swisse-gold transition-colors duration-500 dark:bg-swisse-canvas dark:text-swisse-ink dark:hover:bg-swisse-gold dark:hover:text-swisse-ink"
      >
        {isFrench ? 'Decouvrir la Collection' : 'Discover the Collection'}
      </Link>
      <Link
        href="/about"
        onClick={(event) => {
          event.preventDefault();
          scrollToHomeSection('brand-story');
        }}
        className="group inline-flex items-center justify-center sm:justify-start gap-3 text-xs font-bold uppercase tracking-widest text-swisse-ink dark:text-swisse-canvas"
      >
        <span>{isFrench ? 'Comment ca marche ?' : 'How it Works?'}</span>
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-2" />
      </Link>
    </motion.div>
  );
}
