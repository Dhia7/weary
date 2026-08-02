'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import ProductCard from './ProductCard';
import { useProducts } from '@/lib/hooks/useProducts';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getImageUrl } from '@/lib/utils';
import { getPrimaryDisplayImage } from '@/lib/utils/productImages';
import type { Product as CatalogProduct } from '@/lib/types/product';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  SKU: string;
  weightGrams?: number;
  isActive: boolean;
  imageUrl?: string;
  images?: string[];
  mainThumbnailIndex?: number;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  size?: string | null;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const PRODUCT_LIMIT = 6;
const COLLAGE_LIMIT = 4;

function productImageUrls(items: Product[]): string[] {
  return items
    .map((p) => {
      const src = getPrimaryDisplayImage(p as CatalogProduct) || p.imageUrl;
      return src ? getImageUrl(src) : null;
    })
    .filter((url): url is string => Boolean(url));
}

const FeaturedProducts = () => {
  const { isFrench } = useLanguage();
  const { products, loading } = useProducts({
    limit: PRODUCT_LIMIT,
    active: true,
  });
  const { products: collageProducts } = useProducts({
    limit: COLLAGE_LIMIT,
    active: true,
    homepageCollage: true,
  });

  const heading = isFrench ? 'Coups de cœur' : 'Bestsellers';
  const subcopy = isFrench
    ? 'Des pièces sélectionnées, prêtes à commander — photos réelles, prix en TND.'
    : 'Handpicked pieces ready to order — real photos, prices in TND.';

  const collageFromAdmin = productImageUrls(collageProducts as Product[]);
  const collageFallback = productImageUrls(products as Product[]);
  const collageImages = [
    ...collageFromAdmin,
    ...collageFallback.filter((url) => !collageFromAdmin.includes(url)),
  ].slice(0, COLLAGE_LIMIT);

  if (loading && products.length === 0) {
    return (
      <section id="most-loved" className="py-20 md:py-28 bg-swisse-canvas dark:bg-background">
        <div className="max-w-swisse mx-auto px-6 md:px-8">
          <div className="mb-14 md:mb-16 animate-pulse">
            <div className="min-h-[220px] md:min-h-[300px] bg-swisse-mist dark:bg-muted" />
          </div>
          <div className="mb-14 md:mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-swisse-ink dark:text-foreground">
              {heading}
            </h2>
            <p className="mt-4 max-w-lg text-swisse-ink/65 dark:text-muted-foreground">
              {subcopy}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[...Array(PRODUCT_LIMIT)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-swisse-mist dark:bg-muted rounded-sm mb-6" />
                <div className="h-4 bg-swisse-mist dark:bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-swisse-mist dark:bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
  };

  return (
    <section id="most-loved" className="py-20 md:py-28 bg-swisse-canvas dark:bg-background">
      <div className="max-w-swisse mx-auto px-6 md:px-8">
        {products.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="mb-14 md:mb-16"
            >
              <Link
                href="/products"
                className="group relative block w-full overflow-hidden border border-swisse-gold/25 dark:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swisse-gold"
              >
                {/* Same 4-up 3:4 collage on every breakpoint so framing stays identical */}
                <div className="grid grid-cols-4 w-full">
                  {Array.from({ length: COLLAGE_LIMIT }, (_, i) => {
                    const src = collageImages[i] ?? null;
                    return (
                      <div
                        key={src ? `${src}-${i}` : `slot-${i}`}
                        className="relative aspect-[3/4] w-full bg-swisse-mist dark:bg-muted overflow-hidden"
                      >
                        {src ? (
                          <Image
                            src={src}
                            alt=""
                            fill
                            sizes="25vw"
                            quality={90}
                            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                            priority={i < 2}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="absolute inset-0 bg-swisse-ink/40 dark:bg-background/50 transition-colors duration-300 group-hover:bg-swisse-ink/30 dark:group-hover:bg-background/40" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 px-3 sm:px-6 text-center">
                  <span className="inline-flex items-center gap-2 sm:gap-3 font-serif text-xl sm:text-3xl md:text-4xl text-swisse-canvas dark:text-foreground drop-shadow-sm">
                    {isFrench ? 'Voir tous les produits' : 'View all products'}
                    <ArrowRightIcon className="h-5 w-5 sm:h-7 sm:w-7 transition-transform duration-300 group-hover:translate-x-2" />
                  </span>
                  <span className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-2.5 bg-swisse-canvas text-swisse-ink text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 group-hover:bg-swisse-gold group-hover:text-swisse-ink dark:bg-foreground dark:text-background dark:group-hover:bg-primary">
                    {isFrench ? 'Explorer la collection' : 'Browse the collection'}
                  </span>
                </div>
              </Link>
            </motion.div>

            <div className="mb-14 md:mb-16">
              <h2 className="font-serif text-4xl md:text-5xl text-swisse-ink dark:text-foreground">
                {heading}
              </h2>
              <p className="mt-4 max-w-lg text-swisse-ink/65 dark:text-muted-foreground">
                {subcopy}
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 md:gap-y-16"
            >
              {products.map((item) => {
                const product = item as Product;
                return (
                  <motion.div key={product.id} variants={itemVariants}>
                    <ProductCard product={product} variant="editorial" />
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        ) : (
          <>
            <div className="mb-14 md:mb-16">
              <h2 className="font-serif text-4xl md:text-5xl text-swisse-ink dark:text-foreground">
                {heading}
              </h2>
              <p className="mt-4 max-w-lg text-swisse-ink/65 dark:text-muted-foreground">
                {subcopy}
              </p>
            </div>
            <p className="text-center text-swisse-ink/60 dark:text-muted-foreground text-lg py-12">
              {isFrench
                ? 'Aucun produit disponible pour le moment. Revenez bientôt !'
                : 'No products available yet. Check back soon!'}
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
