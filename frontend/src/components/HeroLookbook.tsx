'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { HOME_IMAGES, HERO_IMAGE_QUALITY } from '@/lib/homeImages';
import { useProducts } from '@/lib/hooks/useProducts';
import { getImageUrl } from '@/lib/utils';
import { getPrimaryDisplayImage } from '@/lib/utils/productImages';
import type { Product } from '@/lib/types/product';

type HeroLookbookProps = {
  alt: string;
};

const CYCLE_MS = 7500;
const MAX_EXTRA_SLIDES = 2;

type Slide = {
  src: string;
  priority?: boolean;
};

export default function HeroLookbook({ alt }: HeroLookbookProps) {
  const reduceMotion = useReducedMotion();
  const { products } = useProducts({ limit: 6, active: true });
  const { products: collageProducts } = useProducts({
    limit: 4,
    active: true,
    homepageCollage: true,
  });

  const slides = useMemo<Slide[]>(() => {
    const productPool = [
      ...(collageProducts as Product[]),
      ...(products as Product[]),
    ];
    const seen = new Set<string>([HOME_IMAGES.hero]);
    const extras: Slide[] = [];

    for (const product of productPool) {
      if (extras.length >= MAX_EXTRA_SLIDES) break;
      const raw = getPrimaryDisplayImage(product) || product.imageUrl;
      const src = raw ? getImageUrl(raw) : null;
      if (!src || seen.has(src)) continue;
      seen.add(src);
      extras.push({ src });
    }

    return [{ src: HOME_IMAGES.hero, priority: true }, ...extras];
  }, [collageProducts, products]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion || slides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, slides.length]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 40, damping: 22, mass: 0.6 });
  const springY = useSpring(my, { stiffness: 40, damping: 22, mass: 0.6 });
  const transform = useMotionTemplate`translate3d(${springX}px, ${springY}px, 0) scale(1.08)`;

  useEffect(() => {
    if (reduceMotion) return;

    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      if (!w || !h) return;
      mx.set((e.clientX / w - 0.5) * 28);
      my.set((e.clientY / h - 0.5) * 18);
    };

    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [mx, my, reduceMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute inset-[-4%] will-change-transform"
        style={reduceMotion ? undefined : { transform }}
      >
        {slides.map((slide, index) => {
          const isActive = index === active;
          return (
            <motion.div
              key={slide.src}
              className="absolute inset-0"
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scale: reduceMotion ? 1 : isActive ? 1.04 : 1,
              }}
              transition={{
                opacity: { duration: reduceMotion ? 0 : 1.4, ease: 'easeInOut' },
                scale: {
                  duration: reduceMotion ? 0 : CYCLE_MS / 1000,
                  ease: 'linear',
                },
              }}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                className="object-cover"
                priority={Boolean(slide.priority)}
                fetchPriority={slide.priority ? 'high' : 'auto'}
                sizes="100vw"
                quality={slide.priority ? HERO_IMAGE_QUALITY : 80}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Keep one semantically meaningful image for a11y / LCP tooling */}
      <span className="sr-only">{alt}</span>

      <div className="absolute inset-0 bg-white/10 bg-gradient-to-t from-swisse-canvas via-swisse-canvas/40 to-transparent dark:from-background dark:via-background/50 dark:to-transparent pointer-events-none" />
    </div>
  );
}
