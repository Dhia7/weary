'use client';

import { useEffect, useState } from 'react';
import { AdminGuard, API_BASE_URL, useAuthorizedFetch } from '@/lib/admin';
import { formatPrice } from '@/lib/utils';

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersWithAddresses: number;
  recentUsers: number;
  usersByCountry: any[];
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  ordersByStatus: { status: string; count: string }[];
  revenueLast30Days: number;
  topProducts: any[];
}

export default function AdminDashboardPage() {
  const fetcher = useAuthorizedFetch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetcher('/admin/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher]);

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        {loading && <div>Loading...</div>}
        {!loading && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Users" value={data.totalUsers} />
              <Stat label="Active Users" value={data.activeUsers} />
              <Stat label="Products" value={data.totalProducts} />
              <Stat label="Orders" value={data.totalOrders} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card title="Orders by Status">
                <ul className="text-sm space-y-1">
                  {data.ordersByStatus?.map((s) => (
                    <li key={s.status} className="flex justify-between">
                      <span className="capitalize">{s.status}</span>
                      <span>{s.count}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Revenue (30d)">
                <div className="text-xl font-semibold">{formatPrice((data.revenueLast30Days || 0) / 100)}</div>
              </Card>
              <Card title="Top Products (30d)">
                <ul className="text-sm space-y-1">
                  {data.topProducts?.map((p: any) => (
                    <li key={p.productId} className="flex justify-between">
                      <span>{p.Product?.name}</span>
                      <span>x{p.dataValues?.totalSold}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-4 bg-white dark:bg-gray-800">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border p-4 bg-white dark:bg-gray-800">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}


