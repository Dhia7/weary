'use client';

import { scrollToHomeSection } from '@/lib/homeSectionNavigation';

type HeroScrollButtonProps = {
  isFrench: boolean;
};

export default function HeroScrollButton({ isFrench }: HeroScrollButtonProps) {
  return (
    <button
      type="button"
      onClick={() => scrollToHomeSection('most-loved')}
      className="absolute bottom-6 left-1/2 z-10 flex min-h-11 -translate-x-1/2 flex-col items-center text-swisse-ink/70 transition-colors hover:text-swisse-gold dark:text-swisse-canvas/70 md:bottom-7"
      aria-label={isFrench ? 'Defiler vers le contenu' : 'Scroll to content'}
    >
      <span className="flex animate-hero-scroll flex-col items-center gap-3 md:gap-2">
        <span className="-translate-y-5 rotate-90 text-[10px] uppercase tracking-[0.5em]">
          {isFrench ? 'Defiler' : 'Scroll'}
        </span>
        <div className="h-14 w-px bg-gradient-to-b from-swisse-gold/20 to-swisse-gold/60 md:h-10" />
      </span>
    </button>
  );
}
