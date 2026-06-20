'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';
import { getImageUrl } from '@/lib/utils';
import type { ColorOption, ProductDisplayBadge } from '@/lib/types/product';

interface Product {
  id: number;
  name: string;
  slug: string;
  SKU: string;
  isActive: boolean;
  displayBadge?: ProductDisplayBadge;
  defaultDisplayColor?: string | null;
  hasVariants?: boolean;
  colorOptions?: ColorOption[];
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  size?: string | null;
  stockInfo?: {
    quantity?: number;
    status: string;
    isInStock: boolean;
    isLowStock?: boolean;
  };
  categories?: Array<{ id: number; name: string; slug: string; }>;
}

const BADGE_OPTIONS: Array<{ value: ProductDisplayBadge; label: string }> = [
  { value: null, label: 'None' },
  { value: 'new_arrival', label: 'New Arrival' },
  { value: 'sold', label: 'Sold' },
];

export default function AdminProductsPage() {
  const fetcher = useAuthorizedFetch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBadgeId, setUpdatingBadgeId] = useState<number | null>(null);
  const [updatingColorId, setUpdatingColorId] = useState<number | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const cacheBuster = `&t=${Date.now()}`;
      const res = await fetcher(`/products?limit=50${cacheBuster}`);
      const json = await res.json();
      if (res.ok) {
        setProducts(json.data.products);
        console.log('Products loaded:', json.data.products.length, 'products');
        // Log stock info for debugging products with stock issues
        json.data.products.forEach((p: Product) => {
          const quantity = p.stockInfo?.quantity ?? p.quantity ?? 0;
          const isInStock = p.stockInfo?.isInStock ?? quantity > 0;
          if (!isInStock && quantity === 0) {
            console.log(`⚠️ Product "${p.name}" (ID: ${p.id}) - Quantity: ${quantity}, StockInfo:`, p.stockInfo);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetcher]); // Include fetcher in dependency array

  const handleBadgeChange = async (productId: number, displayBadge: ProductDisplayBadge) => {
    try {
      setUpdatingBadgeId(productId);
      const res = await fetcher(`/products/${productId}/display-badge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayBadge }),
      });
      const json = await res.json();
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, displayBadge: json.data.product.displayBadge ?? null }
              : p
          )
        );
      } else {
        console.error('Failed to update badge:', json.message);
      }
    } catch (error) {
      console.error('Error updating badge:', error);
    } finally {
      setUpdatingBadgeId(null);
    }
  };

  const handleDefaultDisplayColorChange = async (
    productId: number,
    defaultDisplayColor: string | null
  ) => {
    try {
      setUpdatingColorId(productId);
      const res = await fetcher(`/products/${productId}/default-display-color`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultDisplayColor }),
      });
      const json = await res.json();
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  defaultDisplayColor: json.data.product.defaultDisplayColor ?? null,
                }
              : p
          )
        );
      } else {
        console.error('Failed to update featured color:', json.message);
      }
    } catch (error) {
      console.error('Error updating featured color:', error);
    } finally {
      setUpdatingColorId(null);
    }
  };

  // Refresh products when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchProducts();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loading]);


  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
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
                      Sizes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Featured color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Badge
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
                          <span className="font-medium">{Number(product.price).toFixed(2)} TND</span>
                          {product.compareAtPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              {Number(product.compareAtPrice).toFixed(2)} TND
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {(() => {
                          const quantity = Number(
                            product.stockInfo?.quantity ?? product.quantity ?? 0
                          );
                          const isOutOfStock = quantity <= 0;
                          const isLowStock = quantity > 0 && quantity <= 10;

                          return (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : isLowStock
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}
                            >
                              {isOutOfStock ? 'Out of stock' : `${quantity} in stock`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {product.size?.trim() ? (
                          <span className="line-clamp-2">{product.size}</span>
                        ) : (
                          <span className="text-gray-400">No sizes</span>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {product.hasVariants && product.colorOptions && product.colorOptions.length > 0 ? (
                          <select
                            aria-label={`Featured color for ${product.name}`}
                            value={
                              product.defaultDisplayColor ??
                              product.colorOptions[0]?.name ??
                              ''
                            }
                            disabled={updatingColorId === product.id}
                            onChange={(e) => {
                              handleDefaultDisplayColorChange(product.id, e.target.value || null);
                            }}
                            className="block w-full min-w-[8.5rem] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1.5 pl-2 pr-8 text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {product.colorOptions.map((option) => (
                              <option key={option.name} value={option.name}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          aria-label={`Badge for ${product.name}`}
                          value={product.displayBadge ?? ''}
                          disabled={updatingBadgeId === product.id}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleBadgeChange(
                              product.id,
                              value === '' ? null : (value as 'new_arrival' | 'sold')
                            );
                          }}
                          className="block w-full min-w-[8.5rem] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1.5 pl-2 pr-8 text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {BADGE_OPTIONS.map((option) => (
                            <option key={option.label} value={option.value ?? ''}>
                              {option.label}
                            </option>
                          ))}
                        </select>
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


