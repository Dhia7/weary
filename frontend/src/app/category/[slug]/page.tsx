'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import NotFoundState from '@/components/NotFoundState';
import { motion } from 'framer-motion';
import { SortAsc, Grid, List, Package } from 'lucide-react';
import { useCategoryProducts } from '@/lib/hooks/useCategoryProducts';
import {
  bodyTextClass,
  inlineLinkClass,
  inputClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButtonClass,
  sectionTitleClass,
} from '@/lib/content-page-styles';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  SKU: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  weightGrams?: number;
  isActive: boolean;
  imageUrl?: string;
  images: string[];
  mainThumbnailIndex?: number;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

type ApiProduct = Omit<Product, 'price' | 'compareAtPrice' | 'images' | 'imageUrl' | 'quantity' | 'categories'> & {
  price: number | string;
  compareAtPrice?: number | string;
  images?: unknown;
  imageUrl?: string | null;
  quantity?: number;
  stockInfo?: { quantity?: number };
  categories?: unknown;
};

function normalizeProducts(raw: unknown[]): Product[] {
  return raw.map((p) => {
    const item = p as ApiProduct;
    return {
      ...item,
      price: typeof item.price === 'string' ? Number(item.price) : item.price,
      compareAtPrice:
        typeof item.compareAtPrice === 'string'
          ? Number(item.compareAtPrice)
          : item.compareAtPrice,
      images: Array.isArray(item.images)
        ? (item.images as string[])
        : item.imageUrl
          ? [item.imageUrl]
          : [],
      imageUrl:
        item.imageUrl ||
        (Array.isArray(item.images) && (item.images as string[])[0]) ||
        undefined,
      quantity:
        typeof item.quantity === 'number' ? item.quantity : (item.stockInfo?.quantity ?? 0),
      categories: Array.isArray(item.categories)
        ? (item.categories as Product['categories'])
        : [],
    } as Product;
  });
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { category: apiCategory, products: rawProducts, loading, error, mutate } =
    useCategoryProducts(
      slug
        ? { slug, sort: sortBy, order: sortOrder }
        : null
    );

  const is404 = (error as (Error & { status?: number }) | undefined)?.status === 404;

  const category = useMemo(() => {
    if (apiCategory) return apiCategory;
    if (is404 && slug) {
      const nameFromSlug = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { id: 0, name: nameFromSlug, slug };
    }
    return null;
  }, [apiCategory, is404, slug]);

  const products = useMemo(
    () => normalizeProducts((rawProducts as unknown[]) ?? []),
    [rawProducts]
  );

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : '';

  if (loading && !category && products.length === 0) {
    return (
      <div className={pageShellClass}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px] pt-28">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-swisse-gold/30 border-t-swisse-gold" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !category && !is404) {
    return (
      <NotFoundState
        code="!"
        title="Error Loading Category"
        description={errorMessage}
        onRetry={() => mutate()}
        showBack={false}
      />
    );
  }

  return (
    <div className={pageShellClass}>
      <Navigation />

      <div className="border-b border-swisse-gold/10 dark:border-border pt-24">
        <div className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={pageTitleClass}>{category?.name}</h1>
            {category?.description && (
              <p className={pageSubtitleClass}>{category.description}</p>
            )}
            {products.length > 0 && (
              <p className={`text-sm ${bodyTextClass} mt-2`}>
                {products.length} products found
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {products.length > 0 && (
        <div className="border-b border-swisse-gold/10 dark:border-border">
          <div className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-swisse-gold/70" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground">
                    Sort by:
                  </span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setSortBy(sort);
                      setSortOrder(order);
                    }}
                    title="Sort products"
                    className={`${inputClass} py-2 text-sm`}
                  >
                    <option value="name-ASC">Name A-Z</option>
                    <option value="name-DESC">Name Z-A</option>
                    <option value="price-ASC">Price Low to High</option>
                    <option value="price-DESC">Price High to Low</option>
                    <option value="createdAt-DESC">Newest First</option>
                    <option value="createdAt-ASC">Oldest First</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 border border-swisse-gold/25 dark:border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-swisse-ink text-swisse-canvas dark:bg-foreground dark:text-background' : 'text-swisse-ink/60 hover:text-swisse-gold dark:text-muted-foreground'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="List view"
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-swisse-ink text-swisse-canvas dark:bg-foreground dark:text-background' : 'text-swisse-ink/60 hover:text-swisse-gold dark:text-muted-foreground'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="max-w-md mx-auto">
              <Package
                aria-hidden
                className="mx-auto h-16 w-16 text-swisse-gold/40 dark:text-primary/30 mb-8"
                strokeWidth={1}
              />
              <h2 className={`${sectionTitleClass} mb-4`}>
                {category?.name} Collection Coming Soon
              </h2>
              <p className={`${bodyTextClass} leading-relaxed mb-10`}>
                We&apos;re working on curating the perfect {category?.name?.toLowerCase()} collection for you.
                Check back soon or explore our other categories!
              </p>
              <div className="space-y-6">
                <Link href="/collections" className={primaryButtonClass}>
                  Browse All Collections
                </Link>
                <p className={`text-sm ${bodyTextClass}`}>
                  <Link href="/contact" className={inlineLinkClass}>
                    Contact us
                  </Link>
                  {' '}if you&apos;re looking for something specific
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
