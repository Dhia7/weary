'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { HOME_IMAGES } from '@/lib/homeImages';

const COLLECTIONS = [
  {
    id: 'men',
    title: 'Men Collection',
    titleFr: 'Collection Homme',
    tag: 'New Arrival',
    tagFr: 'Nouvelle Arrivee',
    description: 'Coats, jackets & accessories',
    descriptionFr: 'Manteaux, vestes & accessoires',
    image: HOME_IMAGES.menCollection,
    href: '/category/men',
  },
  {
    id: 'women',
    title: 'Women Collection',
    titleFr: 'Collection Femme',
    tag: 'Best-Sellers',
    tagFr: 'Best-Sellers',
    description: 'Dresses, silks & leather goods',
    descriptionFr: 'Robes, soieries & maroquinerie',
    image: HOME_IMAGES.womenCollection,
    href: '/category/women',
  },
];

export default function HomeFeaturedCollections() {
  const { isFrench } = useLanguage();

  return (
    <section id="collections" aria-labelledby="collections-heading" className="py-24 md:py-32 px-6 md:px-8 max-w-swisse mx-auto">
      <h2 id="collections-heading" className="sr-only">
        {isFrench ? 'Collections' : 'Collections'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
        {COLLECTIONS.map((col, index) => (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: index * 0.15 }}
            className="group relative h-[420px] sm:h-[520px] md:h-[640px] lg:h-[700px] overflow-hidden"
          >
            <Link href={col.href} className="block h-full w-full">
              <Image
                src={col.image}
                alt={isFrench ? col.titleFr : col.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-white/10 transition-colors duration-500 group-hover:bg-swisse-canvas/20" />
              <div className="absolute bottom-10 left-8 md:bottom-12 md:left-12 z-10">
                <span className="inline-block mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-swisse-ink/85">
                  {isFrench ? col.tagFr : col.tag}
                </span>
                <h3 className="font-serif text-3xl md:text-4xl text-swisse-ink mb-4">
                  {isFrench ? col.titleFr : col.title}
                </h3>
                <p className="text-sm md:text-base text-swisse-ink/85 mb-5 max-w-md">
                  {isFrench ? col.descriptionFr : col.description}
                </p>
                <span className="inline-block border-b border-swisse-ink pb-1 text-xs font-bold uppercase tracking-widest text-swisse-ink transition-colors group-hover:text-swisse-gold group-hover:border-swisse-gold">
                  {isFrench ? 'Voir la Selection' : 'View Selection'}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
