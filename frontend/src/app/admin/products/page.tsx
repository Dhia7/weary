'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';

interface Product {
  id: number;
  name: string;
  slug: string;
  SKU: string;
  isActive: boolean;
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
  }, [fetcher]);

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Products</h1>
          <Link href="/admin/products/new" className="px-3 py-2 rounded bg-indigo-600 text-white text-sm">New Product</Link>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Slug</th>
                  <th className="text-left p-2">Active</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.SKU}</td>
                    <td className="p-2">{p.slug}</td>
                    <td className="p-2">{p.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2 space-x-2">
                      <Link className="text-indigo-600" href={`/admin/products/${p.id}`}>Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}


