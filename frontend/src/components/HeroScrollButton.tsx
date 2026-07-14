'use client';

import { scrollToHomeSection } from '@/lib/homeSectionNavigation';

type HeroScrollButtonProps = {
  isFrench: boolean;
};

export default function HeroScrollButton({ isFrench }: HeroScrollButtonProps) {
  return (
    <button
      type="button"
      onClick={() => scrollToHomeSection('collections')}
      className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-10 flex min-h-11 flex-col items-center gap-3 md:gap-4 text-swisse-ink/70 dark:text-swisse-canvas/70 hover:text-swisse-gold transition-colors"
      aria-label={isFrench ? 'Defiler vers le contenu' : 'Scroll to content'}
    >
      <span className="text-[10px] uppercase tracking-[0.5em] rotate-90 -translate-y-5">
        {isFrench ? 'Defiler' : 'Scroll'}
      </span>
      <div className="w-px h-14 md:h-20 bg-gradient-to-b from-swisse-gold/20 to-swisse-gold/60" />
    </button>
  );
}
