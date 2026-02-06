'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ShoppingBagIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '@/lib/contexts/CartContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getImageUrl } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  SKU: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  size?: string | null;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  products: Product[];
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistedItems, setWishlistedItems] = useState<Set<number>>(new Set());
  const { addItem } = useCart();

  useEffect(() => {
    if (slug) {
      fetchCollection();
    }
  }, [slug]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/collections/${slug}`);
      const data = await response.json();
      
      if (response.ok) {
        setCollection(data.data.collection);
      } else {
        setError(data.message || 'Collection not found');
      }
    } catch (err) {
      setError('Failed to load collection');
      console.error('Error fetching collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // If product has sizes, redirect to product page for size selection
    if (product.size && product.size.trim().length > 0) {
      router.push(`/product/${product.slug}`);
      return;
    }
    
    // For products without sizes, add directly to cart
    addItem({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      image: product.imageUrl || '/placeholder-product.jpg',
      slug: product.slug
    }, 1);
  };

  const handleWishlist = (productId: number) => {
    setWishlistedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
    // TODO: Implement wishlist functionality
    console.log('Wishlist toggled:', productId);
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(price));
  };

  const getCategoryEmoji = (categories?: Array<{name: string}>) => {
    if (!categories || categories.length === 0) return '👕';
    
    const categoryName = categories[0].name.toLowerCase();
    switch (categoryName) {
      case 'clothing':
        return '👗';
      case 'accessories':
        return '👜';
      case 'shoes':
        return '👠';
      default:
        return '👕';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Collection not found'}
          </h1>
          <Link 
            href="/"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300">
            Home
          </Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-gray-700 dark:hover:text-gray-300">
            Collections
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{collection.name}</span>
        </nav>

        {/* Collection Header */}
        <div className="mb-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {collection.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {collection.products.length} {collection.products.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {collection.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collection.products.map((product) => (
              <div
                key={product.id}
                className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <Link href={`/product/${product.slug}`} className="block">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={getImageUrl(product.imageUrl) || ''}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                        <span className="text-6xl">{getCategoryEmoji(product.categories)}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Wishlist Button */}
                <button
                  onClick={() => handleWishlist(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                >
                  {wishlistedItems.has(product.id) ? (
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                {/* Quick Add to Cart */}
                <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.quantity === 0}
                    className="w-full py-3 px-4 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBagIcon className="w-4 h-4 mr-2" />
                    {product.quantity === 0 
                      ? 'Out of Stock' 
                      : (product.size && product.size.trim().length > 0)
                      ? 'Select Size'
                      : 'Quick Add'}
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Category */}
                  {product.categories && product.categories.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {product.categories[0].name}
                    </p>
                  )}
                  
                  {/* Product Name */}
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(product.price)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.quantity > 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      SKU: {product.SKU}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No products in this collection yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Check back soon for new additions to this collection.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
