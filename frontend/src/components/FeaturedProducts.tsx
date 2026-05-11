'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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

const FeaturedProducts = () => {
  const { isFrench } = useLanguage();
  const { products, loading } = useProducts({ limit: 8, active: true });

  if (loading) {
    return (
      <section id="most-loved" className="py-24 md:py-32 bg-swisse-canvas dark:bg-background">
        <div className="max-w-swisse mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16 md:mb-20">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-swisse-ink dark:text-foreground">
                {isFrench ? 'Produits en vedette' : 'Featured Products'}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[...Array(8)].map((_, i) => (
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
    <section id="most-loved" className="py-24 md:py-32 bg-swisse-canvas dark:bg-background">
      <div className="max-w-swisse mx-auto px-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16 md:mb-20">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl text-swisse-ink dark:text-foreground">
              {isFrench ? 'Produits en vedette' : 'Featured Products'}
            </h2>
          </div>
          <Link
            href="/products"
            className="self-start sm:self-auto text-xs font-bold uppercase tracking-widest border-b border-swisse-ink pb-1 text-swisse-ink hover:text-swisse-gold hover:border-swisse-gold transition-colors dark:border-foreground dark:text-foreground dark:hover:text-primary dark:hover:border-primary"
          >
            {isFrench ? 'Tout explorer' : 'Explore All'}
          </Link>
        </div>

        {products.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14 md:gap-y-16"
          >
            {products.map((product: Product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard product={product} variant="editorial" />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-center text-swisse-ink/60 dark:text-muted-foreground text-lg py-12">
            {isFrench
              ? 'Aucun produit disponible pour le moment. Revenez bientot !'
              : 'No products available yet. Check back soon!'}
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
