'use client';

import { useSyncExternalStore } from 'react';
import OrbitImages from '@/components/OrbitImages';
import { useProducts } from '@/lib/hooks/useProducts';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getImageUrl } from '@/lib/utils';
import {
  getHoverDisplayImage,
  getPrimaryDisplayImage,
  getProductDisplayImages,
} from '@/lib/utils/productImages';
import { getProductHref, type Product } from '@/lib/types/product';
import { getProductDisplayName } from '@/lib/i18n/product';

const PRODUCT_LIMIT = 6;

/** Wide ellipse fills most of the 1400 design canvas — same on every device via responsive scale. */
const ORBIT = {
  shape: 'ellipse' as const,
  radiusX: 580,
  radiusY: 190,
  radius: 160,
  itemSize: 150,
  rotation: -8,
  duration: 50,
  pathWidth: 2,
};

function getIsNarrow(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 1023px)').matches;
}

function subscribeIsNarrow(onChange: () => void) {
  const mq = window.matchMedia('(max-width: 1023px)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribeIsNarrow, getIsNarrow, () => false);
}

function imageCount(product: Product): number {
  return getProductDisplayImages(product).length;
}

function pickCollectionProducts(products: Product[]): Product[] {
  return [...products]
    .sort((a, b) => imageCount(b) - imageCount(a))
    .slice(0, PRODUCT_LIMIT);
}

function SectionHeading({
  heading,
  className = '',
}: {
  heading: string;
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-swisse-gold">
        2026
      </p>
      <h2 className="mt-1.5 sm:mt-2 font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight text-swisse-ink dark:text-foreground text-balance">
        {heading}
      </h2>
    </div>
  );
}

export default function NouvelleCollection() {
  const { isFrench } = useLanguage();
  const isNarrow = useIsNarrow();
  const { products, loading } = useProducts({ limit: PRODUCT_LIMIT, active: true });

  const heading = isFrench ? 'Nouvelle Collection' : 'New Collection';

  const orbitItems = pickCollectionProducts((products || []) as Product[])
    .map((p) => {
      const colorOpts =
        p.hasVariants && p.defaultDisplayColor
          ? { selectedColor: p.defaultDisplayColor }
          : {};
      const primary =
        getPrimaryDisplayImage(p, colorOpts) ||
        getProductDisplayImages(p, colorOpts)[0] ||
        p.imageUrl;
      const src = getImageUrl(primary);
      if (!src || !p.slug) return null;
      const hoverRaw = getHoverDisplayImage(p, colorOpts);
      const hoverSrc = hoverRaw ? getImageUrl(hoverRaw) : null;
      return {
        src,
        hoverSrc: hoverSrc && hoverSrc !== src ? hoverSrc : null,
        href: getProductHref(p.slug),
        alt: getProductDisplayName(p, isFrench),
      };
    })
    .filter(
      (
        item
      ): item is { src: string; hoverSrc: string | null; href: string; alt: string } =>
        item != null
    );

  const images = orbitItems.map((item) => item.src);
  const hoverImages = orbitItems.map((item) => item.hoverSrc);
  const links = orbitItems.map((item) => item.href);
  const alts = orbitItems.map((item) => item.alt);

  if (loading) {
    return (
      <section
        id="nouvelle-collection"
        className="relative overflow-hidden py-6 sm:py-8 md:py-12 bg-swisse-canvas dark:bg-background"
      >
        <div className="max-w-swisse mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="mx-auto mb-4 h-8 w-40 animate-pulse rounded bg-swisse-mist dark:bg-muted lg:hidden" />
          <div className="mx-auto aspect-square w-full animate-pulse rounded-full bg-swisse-mist/80 dark:bg-muted/50" />
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section
      id="nouvelle-collection"
      className="relative overflow-hidden py-6 sm:py-8 md:py-12 bg-swisse-canvas dark:bg-background"
      aria-label={heading}
    >
      <div className="max-w-swisse mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Title above on narrow screens — flat ellipse leaves little room in the center when scaled down */}
        {isNarrow ? <SectionHeading heading={heading} className="mb-4 px-2" /> : null}

        <OrbitImages
          images={images}
          hoverImages={hoverImages}
          links={links}
          alts={alts}
          shape={ORBIT.shape}
          radiusX={ORBIT.radiusX}
          radiusY={ORBIT.radiusY}
          radius={ORBIT.radius}
          rotation={ORBIT.rotation}
          duration={ORBIT.duration}
          itemSize={ORBIT.itemSize}
          pathWidth={ORBIT.pathWidth}
          responsive={true}
          direction="normal"
          fill
          showPath={false}
          paused={false}
          pathColor="rgba(197, 160, 89, 0.25)"
          altPrefix={heading}
          className="w-full touch-pan-y"
          centerContent={
            isNarrow ? undefined : (
              <div className="pointer-events-none max-w-xs px-4">
                <SectionHeading heading={heading} />
              </div>
            )
          }
        />
      </div>
    </section>
  );
}
