'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ProductCard from './ProductCard';
import { useProducts } from '@/lib/hooks/useProducts';
import { useLanguage } from '@/lib/contexts/LanguageContext';

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

const FeaturedProducts = () => {
  const { isFrench } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const { products, pagination, loading } = useProducts({
    limit: PRODUCT_LIMIT,
    page: currentPage,
    active: true,
  });

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalProducts = pagination?.totalProducts ?? products.length;

  const heading = isFrench ? 'Coups de cœur' : 'Bestsellers';
  const subcopy = isFrench
    ? 'Des pièces sélectionnées, prêtes à commander — photos réelles, prix en TND.'
    : 'Handpicked pieces ready to order — real photos, prices in TND.';

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    document.getElementById('most-loved')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pageNumbers = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, totalPages, currentPage]);
    if (currentPage > 1) pages.add(currentPage - 1);
    if (currentPage < totalPages) pages.add(currentPage + 1);
    return Array.from(pages).sort((a, b) => a - b);
  })();

  if (loading && products.length === 0) {
    return (
      <section id="most-loved" className="py-20 md:py-28 bg-swisse-canvas dark:bg-background">
        <div className="max-w-swisse mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-14 md:mb-16">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-swisse-ink dark:text-foreground">
                {heading}
              </h2>
              <p className="mt-4 max-w-lg text-swisse-ink/65 dark:text-muted-foreground">
                {subcopy}
              </p>
            </div>
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-14 md:mb-16">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl text-swisse-ink dark:text-foreground">
              {heading}
            </h2>
            <p className="mt-4 max-w-lg text-swisse-ink/65 dark:text-muted-foreground">
              {subcopy}
            </p>
          </div>
          <Link
            href="/products"
            className="self-start sm:self-auto inline-flex items-center justify-center px-8 py-3.5 bg-swisse-ink text-swisse-canvas text-[11px] font-bold uppercase tracking-widest hover:bg-swisse-gold transition-colors duration-300 shadow-sm dark:bg-foreground dark:text-background dark:hover:bg-primary"
          >
            {isFrench ? 'Tout explorer' : 'Explore All'}
          </Link>
        </div>

        {products.length > 0 ? (
          <>
            <motion.div
              key={currentPage}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 md:gap-y-16 ${
                loading ? 'opacity-60' : ''
              }`}
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

            <div className="mt-14 md:mt-16 flex flex-col items-center gap-8">
              <p className="text-sm text-swisse-ink/60 dark:text-muted-foreground">
                {isFrench
                  ? `Affichage de ${(currentPage - 1) * PRODUCT_LIMIT + 1}–${Math.min(
                      currentPage * PRODUCT_LIMIT,
                      totalProducts
                    )} sur ${totalProducts} produits`
                  : `Showing ${(currentPage - 1) * PRODUCT_LIMIT + 1}–${Math.min(
                      currentPage * PRODUCT_LIMIT,
                      totalProducts
                    )} of ${totalProducts} products`}
              </p>

              {totalPages > 1 && (
                <nav
                  className="flex items-center gap-2"
                  aria-label={isFrench ? 'Pagination des produits' : 'Product pagination'}
                >
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center border border-swisse-gold/25 dark:border-border text-swisse-ink dark:text-foreground hover:border-swisse-gold hover:text-swisse-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={isFrench ? 'Page précédente' : 'Previous page'}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  {pageNumbers.map((page, index) => {
                    const prev = pageNumbers[index - 1];
                    const showEllipsis = prev != null && page - prev > 1;
                    return (
                      <span key={page} className="contents">
                        {showEllipsis && (
                          <span className="px-1 text-swisse-ink/40 dark:text-muted-foreground" aria-hidden>
                            …
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(page)}
                          aria-current={page === currentPage ? 'page' : undefined}
                          className={`inline-flex min-h-11 min-w-11 items-center justify-center text-[11px] font-bold uppercase tracking-widest transition-colors ${
                            page === currentPage
                              ? 'bg-swisse-ink text-swisse-canvas dark:bg-foreground dark:text-background'
                              : 'border border-swisse-gold/25 dark:border-border text-swisse-ink dark:text-foreground hover:border-swisse-gold hover:text-swisse-gold'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center border border-swisse-gold/25 dark:border-border text-swisse-ink dark:text-foreground hover:border-swisse-gold hover:text-swisse-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={isFrench ? 'Page suivante' : 'Next page'}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              )}

              <Link
                href="/products"
                className="group inline-flex items-center gap-3 px-10 py-4 bg-swisse-ink text-swisse-canvas text-[11px] font-bold uppercase tracking-widest hover:bg-swisse-gold transition-colors duration-300 dark:bg-foreground dark:text-background dark:hover:bg-primary"
              >
                {isFrench ? 'Voir tous les produits' : 'View all products'}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        ) : (
          <p className="text-center text-swisse-ink/60 dark:text-muted-foreground text-lg py-12">
            {isFrench
              ? 'Aucun produit disponible pour le moment. Revenez bientôt !'
              : 'No products available yet. Check back soon!'}
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
