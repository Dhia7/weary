'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { SortAsc, Grid, List } from 'lucide-react';

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

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}


export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const apiUrl = `http://localhost:3001/api/categories/${slug}/products?sort=${sortBy}&order=${sortOrder}`;
        console.log('🔍 Fetching category data from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Add a small delay to ensure we can see the logs
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!response.ok) {
          console.log('❌ Response not ok, status:', response.status);
          const errorText = await response.text();
          console.log('❌ Error response body:', errorText);
          throw new Error('Category not found');
        }

        const data = await response.json();
        console.log('✅ Response data:', data);
        
        if (data.success && data.data) {
          console.log('✅ Setting category and products from API');
          console.log('✅ Category:', data.data.category);
          console.log('✅ Products count:', data.data.products?.length || 0);
          console.log('✅ Products:', data.data.products);
          setCategory(data.data.category);
          setProducts(data.data.products || []);
        } else {
          console.log('❌ Invalid response format');
          console.log('❌ Data received:', data);
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('❌ Category fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category');
        setCategory(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryData();
    }
  }, [slug, sortBy, sortOrder]);


  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
  };

  const handleOrderChange = (newOrder: string) => {
    setSortOrder(newOrder);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Error Loading Category
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Please check your connection and try again.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Category Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {category?.name}
            </h1>
            {category?.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {products.length} products found
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sort and View Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Sort Controls - Left Side */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    handleSortChange(sort);
                    handleOrderChange(order);
                  }}
                  title="Sort products"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

            {/* View Controls - Right Side */}
            <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid view"
                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List view"
                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {category?.name} Collection Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;re working on curating the perfect {category?.name?.toLowerCase()} collection for you. 
                Check back soon or explore our other categories!
              </p>
              <div className="space-y-3">
                <Link 
                  href="/collections"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Browse All Collections
                </Link>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Contact us
                  </Link>
                  {' '}if you&apos;re looking for something specific
                </div>
              </div>
            </div>
          </div>
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
                <ProductCard
                  product={product}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
