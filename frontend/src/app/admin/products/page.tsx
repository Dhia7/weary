'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';
import { getImageUrl } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  slug: string;
  SKU: string;
  isActive: boolean;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  stockInfo?: {
    quantity?: number;
    status: string;
    isInStock: boolean;
    isLowStock?: boolean;
  };
  categories?: Array<{ id: number; name: string; slug: string; }>;
}

export default function AdminProductsPage() {
  const fetcher = useAuthorizedFetch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetcher('/products?limit=50');
        const json = await res.json();
        if (res.ok) setProducts(json.data.products);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher]); // Include fetcher in dependency array


  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <Link 
            href="/admin/products/new" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Product
          </Link>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading products...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => (
                    <tr 
                      key={product.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 hover:shadow-sm"
                      onClick={() => window.location.href = `/admin/products/${product.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            {product.imageUrl ? (
                              <Image 
                                src={getImageUrl(product.imageUrl) || ''} 
                                alt={product.name}
                                fill
                                unoptimized
                                className="object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                sizes="48px"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No image</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.SKU}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span className="font-medium">${Number(product.price).toFixed(2)}</span>
                          {product.compareAtPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              ${Number(product.compareAtPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stockInfo?.isLowStock
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : product.stockInfo?.isInStock 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {product.stockInfo?.quantity ?? product.quantity} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.categories && product.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.categories.slice(0, 2).map((category) => (
                              <span 
                                key={category.id}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded"
                              >
                                {category.name}
                              </span>
                            ))}
                            {product.categories.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{product.categories.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No categories</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new product.</p>
                  <div className="mt-6">
                    <Link
                      href="/admin/products/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      + New Product
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </AdminGuard>
  );
}


