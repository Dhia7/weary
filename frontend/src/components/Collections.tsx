'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '@/lib/utils';
import { useCollections } from '@/lib/hooks/useCollections';

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  products: Array<{
    id: number;
    name: string;
    slug: string;
    imageUrl?: string;
    price: number;
    compareAtPrice?: number;
  }>;
}

const Collections = () => {
  const { collections, loading } = useCollections({ active: true, limit: 6 });

  // price formatting not used in this component

  const getCollectionEmoji = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('new')) return '✨';
    if (nameLower.includes('best') || nameLower.includes('seller')) return '🏆';
    if (nameLower.includes('sale')) return '🔥';
    if (nameLower.includes('sustainable') || nameLower.includes('eco')) return '🌱';
    if (nameLower.includes('summer')) return '☀️';
    if (nameLower.includes('winter')) return '❄️';
    return '👕';
  };

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto mb-12"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Shop by Collection
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover curated collections of our favorite pieces, from new arrivals to sustainable choices.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {collections.map((collection: Collection) => (
            <motion.div key={collection.id} variants={itemVariants}>
              <Link
                href={`/collections/${collection.slug}`}
                className="group block bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
              {/* Collection Image */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 relative overflow-hidden"
              >
                {collection.imageUrl ? (
                  <Image
                    src={getImageUrl(collection.imageUrl) || ''}
                    alt={collection.name}
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">{getCollectionEmoji(collection.name)}</span>
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                
                {/* Collection Name Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-white text-opacity-90 line-clamp-2">
                    {collection.description}
                  </p>
                </div>
              </motion.div>

              {/* Collection Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {collection.products.length} {collection.products.length === 1 ? 'item' : 'items'}
                  </span>
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>

                {/* Product Preview */}
                {collection.products.length > 0 && (
                  <div className="flex space-x-2">
                    {collection.products.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden relative">
                          {product.imageUrl ? (
                            <Image
                              src={getImageUrl(product.imageUrl) || ''}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-lg">👕</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {collection.products.length > 3 && (
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          +{collection.products.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Collections Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/collections"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View All Collections
              <ArrowRightIcon className="ml-2 -mr-1 w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Collections;
