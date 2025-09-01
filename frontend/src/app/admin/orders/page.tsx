'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';

interface OrderItem { product: { id: number; name: string; SKU: string } }
interface Order {
  id: number;
  status: string;
  totalAmountCents: number;
  currency: string;
  user: { id: number; email: string };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const fetcher = useAuthorizedFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetcher('/admin/orders?limit=50');
        const json = await res.json();
        if (res.ok) setOrders(json.data.orders);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher]);

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Items</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2">{o.id}</td>
                    <td className="p-2">{o.user?.email}</td>
                    <td className="p-2 capitalize">{o.status}</td>
                    <td className="p-2">{(o.totalAmountCents/100).toFixed(2)} {o.currency}</td>
                    <td className="p-2">{o.items?.length || 0}</td>
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


