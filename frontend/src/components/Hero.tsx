'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2574&auto=format&fit=crop';

const Hero = () => {
  const { isFrench } = useLanguage();
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center dark:bg-swisse-ink"
    >
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt={isFrench ? 'Hero mode suisse' : 'Swiss fashion hero'}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/10 bg-gradient-to-t from-swisse-canvas via-swisse-canvas/40 to-transparent dark:from-background dark:via-background/50 dark:to-transparent" />
      </div>

      <div className="relative z-10 max-w-swisse mx-auto px-6 md:px-8 w-full pt-24 pb-32 md:pb-40">
        <div className="max-w-2xl">
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
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] mb-8 text-swisse-ink dark:text-swisse-canvas"
          >
            {isFrench ? 'Le Luxe Suisse,' : 'Swiss Luxury,'} <br />{' '}
            {isFrench ? 'Livre Chez Vous' : 'Delivered to Your Door'}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-10 max-w-xl space-y-3 text-base text-swisse-ink/90 dark:text-swisse-canvas/90 sm:text-lg sm:leading-[1.65] font-normal leading-[1.6]"
          >
            <p>
              {isFrench ? (
                <>
                  En moins d’une semaine, Swissé vous livre des{' '}
                  <strong className="font-semibold text-swisse-ink dark:text-swisse-canvas">
                    créations premium internationales
                  </strong>
                  , soigneusement sélectionnées — mode et lifestyle.
                </>
              ) : (
                <>
                  In under a week, Swissé brings you{' '}
                  <strong className="font-semibold text-swisse-ink dark:text-swisse-canvas">
                    carefully selected international premium pieces
                  </strong>
                  — fashion and lifestyle.
                </>
              )}
            </p>
            <p className="text-swisse-ink/75 dark:text-swisse-canvas/80">
              {isFrench
                ? 'Authenticité, qualité et élégance. Sans intermédiaires, à des prix honnêtes en TND.'
                : 'Authenticity, quality, and elegance. No middlemen — honest prices in TND.'}
            </p>
          </motion.div>
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
              href="#brand-story"
              className="group inline-flex items-center justify-center sm:justify-start gap-3 text-xs font-bold uppercase tracking-widest text-swisse-ink dark:text-swisse-canvas"
            >
              <span>{isFrench ? 'Comment ca marche ?' : 'How it Works?'}</span>
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-2" />
            </Link>
          </motion.div>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 text-swisse-ink/50 dark:text-swisse-canvas/50 hover:text-swisse-gold transition-colors"
        aria-label={isFrench ? 'Defiler vers le contenu' : 'Scroll to content'}
      >
        <span className="text-[10px] uppercase tracking-[0.5em] rotate-90 -translate-y-5">
          {isFrench ? 'Defiler' : 'Scroll'}
        </span>
        <div className="w-px h-20 bg-gradient-to-b from-swisse-gold/20 to-swisse-gold/60" />
      </button>
    </section>
  );
};

export default Hero;
