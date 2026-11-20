'use client';

import { useEffect, useRef, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import NotFoundState from '@/components/NotFoundState';
import { motion } from 'framer-motion';
import { Grid, List } from 'lucide-react';
import { useInfiniteProducts } from '@/lib/hooks/useInfiniteProducts';
import { useLanguage } from '@/lib/contexts/LanguageContext';

function collectionLine(count: number, isFrench: boolean) {
  if (isFrench) {
    return count === 1
      ? 'Découvrez notre collection complète de 1 produit'
      : `Découvrez notre collection complète de ${count} produits`;
  }
  return count === 1
    ? 'Discover our complete collection of 1 product'
    : `Discover our complete collection of ${count} products`;
}

export default function ProductsPage() {
  const [sortBy, setSortBy] = useState('sortOrder');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isFrench } = useLanguage();
  const productsPerPage = 12;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const { products, totalProducts, hasMore, isLoadingMore, loading, error, setSize, mutate } =
    useInfiniteProducts({
      sort: sortBy,
      order: sortOrder,
      limit: productsPerPage,
      active: true,
    });

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : '';

  useEffect(() => {
    loadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadingMoreRef.current || error) return;
        loadingMoreRef.current = true;
        setSize((current) => current + 1);
      },
      { rootMargin: '400px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, error, isLoadingMore, setSize]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <NotFoundState
        code="!"
        title={isFrench ? 'Erreur lors du chargement des produits' : 'Error Loading Products'}
        description={errorMessage}
        onRetry={() => mutate()}
        retryLabel={isFrench ? 'Réessayer' : 'Try Again'}
        homeLabel={isFrench ? 'Accueil' : 'Go Home'}
        showBack={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isFrench ? 'Tous les produits' : 'All Products'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {collectionLine(totalProducts, isFrench)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="products-sort" className="text-sm text-gray-600 dark:text-gray-400">
                {isFrench ? 'Trier par :' : 'Sort by:'}
              </label>
              <select
                id="products-sort"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                  setSize(1);
                }}
                title={isFrench ? 'Trier les produits' : 'Sort products'}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="sortOrder-ASC">{isFrench ? 'En vedette' : 'Featured'}</option>
                <option value="createdAt-DESC">{isFrench ? 'Plus récents' : 'Newest First'}</option>
                <option value="createdAt-ASC">{isFrench ? 'Plus anciens' : 'Oldest First'}</option>
                <option value="name-ASC">{isFrench ? 'Nom A-Z' : 'Name A-Z'}</option>
                <option value="name-DESC">{isFrench ? 'Nom Z-A' : 'Name Z-A'}</option>
                <option value="price-ASC">{isFrench ? 'Prix croissant' : 'Price Low to High'}</option>
                <option value="price-DESC">{isFrench ? 'Prix décroissant' : 'Price High to Low'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{isFrench ? 'Affichage :' : 'View:'}</span>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label={isFrench ? 'Vue grille' : 'Grid view'}
              aria-pressed={viewMode === 'grid'}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 ${
                viewMode === 'grid'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label={isFrench ? 'Vue liste' : 'List view'}
              aria-pressed={viewMode === 'list'}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 ${
                viewMode === 'list'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {products.map((product) => (
              <ProductCard key={(product as { id: number }).id} product={product as Parameters<typeof ProductCard>[0]['product']} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {isFrench ? 'Aucun produit trouvé.' : 'No products found.'}
            </p>
          </div>
        )}

        {products.length > 0 && (hasMore || isLoadingMore || (error && products.length > 0)) && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
            {isLoadingMore && (
              <p className="text-sm text-gray-500 dark:text-gray-400" role="status">
                {isFrench ? 'Chargement d’autres produits' : 'Loading more products'}
              </p>
            )}
            {error && !isLoadingMore && (
              <div className="text-center" role="alert">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {isFrench ? 'Impossible de charger d’autres produits.' : 'Could not load more products.'}
                </p>
                <button
                  type="button"
                  onClick={() => mutate()}
                  className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {isFrench ? 'Réessayer' : 'Retry'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
