'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const DeliveryRouteMapLeaflet = dynamic(
  () => import('@/components/DeliveryRouteMapLeaflet'),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full w-full items-center justify-center bg-swisse-mist/80"
        aria-hidden
      >
        <div className="h-8 w-8 animate-pulse rounded-full bg-swisse-gold/40" />
      </div>
    ),
  }
);

export default function DeliveryRouteMap() {
  const { isFrench } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  const ariaLabel = isFrench
    ? 'Carte : livraison aérienne de Genève, Suisse, vers la Tunisie'
    : 'Map: air delivery from Geneva, Switzerland, to Tunisia';

  const genevaLabel = isFrench ? 'Genève' : 'Geneva';
  const tunisiaLabel = isFrench ? 'Tunisie' : 'Tunisia';
  const caption = isFrench
    ? 'Livraison en 5–7 jours'
    : 'Delivered in 5–7 days';
  const swissHint = isFrench ? 'Suisse' : 'Switzerland';
  const destinationHint = isFrench ? 'Destination' : 'Destination';

  return (
    <div ref={ref} className="relative w-full">
      <div
        className="relative z-10 h-[min(72vw,420px)] min-h-[300px] w-full overflow-hidden bg-swisse-mist/80 dark:bg-swisse-ink/40 sm:h-[min(62vw,460px)] sm:min-h-[360px] lg:aspect-[420/500] lg:h-auto lg:min-h-0 [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-sans [&_.leaflet-tile-pane]:brightness-[1.02] [&_.leaflet-tile-pane]:contrast-[0.96] [&_.leaflet-tile-pane]:saturate-[0.65] [&_.leaflet-control-attribution]:max-w-[55%] [&_.leaflet-control-attribution]:truncate [&_.leaflet-control-attribution]:bg-white/85 [&_.leaflet-control-attribution]:text-[8px] [&_.leaflet-control-attribution]:leading-tight [&_.leaflet-control-attribution]:text-swisse-ink/55 sm:[&_.leaflet-control-attribution]:max-w-none sm:[&_.leaflet-control-attribution]:text-[9px] [&_.swisia-map-label]:!border-0 [&_.swisia-map-label]:!bg-swisse-canvas/95 [&_.swisia-map-label]:!px-2 [&_.swisia-map-label]:!py-1 sm:[&_.swisia-map-label]:!px-2.5 sm:[&_.swisia-map-label]:!py-1.5 [&_.swisia-map-label]:!shadow-[0_4px_16px_rgba(45,36,22,0.12)] [&_.swisia-map-label]:before:!border-transparent [&_.swisia-plane-icon]:!border-0 [&_.swisia-plane-icon]:!bg-transparent [&_.swisia-destination-icon]:!border-0 [&_.swisia-destination-icon]:!bg-transparent"
        role="img"
        aria-label={ariaLabel}
      >
        {inView ? (
          <DeliveryRouteMapLeaflet
            reduceMotion={Boolean(reduceMotion)}
            genevaLabel={genevaLabel}
            swissHint={swissHint}
            tunisiaLabel={tunisiaLabel}
            destinationHint={destinationHint}
          />
        ) : (
          <div className="h-full w-full bg-swisse-mist/80" aria-hidden />
        )}
        <p className="pointer-events-none absolute left-2 right-2 top-3 z-[500] text-center text-[8px] font-bold uppercase tracking-[0.2em] text-swisse-gold drop-shadow-sm sm:left-0 sm:right-0 sm:top-4 sm:text-[9px] sm:tracking-[0.28em]">
          {isFrench ? 'Suisse  →  Tunisie' : 'Switzerland  →  Tunisia'}
        </p>
      </div>

      <div className="absolute inset-x-3 -bottom-3 z-20 bg-swisse-gold px-4 py-3 text-center font-serif text-base text-white shadow-xl sm:inset-x-auto sm:-bottom-4 sm:right-4 sm:px-8 sm:py-5 sm:text-left sm:text-lg md:-bottom-6 md:-right-6 md:px-12 md:py-8 md:text-xl">
        {caption}
      </div>
    </div>
  );
}
