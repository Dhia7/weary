'use client';

import { useEffect, useState } from 'react';
import { useAuthorizedFetch } from '@/lib/admin';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersWithAddresses: number;
  recentUsers: number;
  usersByCountry: Array<{ country: string; count: number }>;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  revenueLast30Days: number;
  topProducts: Array<{ Product?: { id?: number; name?: string; price?: number } | null; orderCount: number; totalQuantity: number }>;
}

export default function AdminDashboardPage() {
  const fetcher = useAuthorizedFetch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher('/admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch dashboard data:', errorData);
        setError(errorData.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Network error: Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []); // Empty dependency array - only fetch once on mount

  const formatPrice = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to your admin dashboard</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Failed to Load Dashboard
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={data?.totalUsers || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Total Products"
              value={data?.totalProducts || 0}
              icon={Package}
              color="green"
            />
            <StatCard
              title="Total Orders"
              value={data?.totalOrders || 0}
              icon={ShoppingCart}
              color="purple"
            />
            <StatCard
              title="Total Revenue (30d)"
              value={formatPrice((data?.revenueLast30Days || 0) / 100)}
              icon={DollarSign}
              color="yellow"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Recent Activity">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data?.recentUsers || 0} new users registered this week
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data?.activeUsers || 0} active users
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data?.verifiedUsers || 0} verified users
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data?.activeProducts || 0} active products
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Orders by Status">
              <div className="space-y-3">
                {data?.ordersByStatus && data.ordersByStatus.length > 0 ? (
                  data.ordersByStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {status.status}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {status.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No order data available
                  </div>
                )}
              </div>
            </Card>

            <Card title="Top Products">
              <div className="space-y-3">
                {data?.topProducts && data.topProducts.length > 0 ? (
                  data.topProducts.map((product, index) => (
                    <div key={product.Product?.id || index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.Product?.name || 'Unknown Product'}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatPrice((product.Product?.price || 0) / 100)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.orderCount} orders
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {product.totalQuantity} sold
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No product data available
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </button>
              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <Package className="h-4 w-4 mr-2" />
                Manage Products
              </button>
              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Orders
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>;
  color: string; 
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
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


