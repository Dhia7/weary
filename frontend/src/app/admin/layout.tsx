'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';
import { getSeenOrderIds } from '@/lib/utils';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const pathname = usePathname();
  const fetcher = useAuthorizedFetch();

  // Calculate unseen new orders count
  const calculateUnseenCount = (orderIds: string[]) => {
    const seenIds = getSeenOrderIds();
    return orderIds.filter(id => !seenIds.has(id)).length;
  };

  // Fetch new orders count
  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      try {
        const res = await fetcher('/admin/orders/count/new');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const orderIds = json.data.orderIds || [];
            const unseenCount = calculateUnseenCount(orderIds);
            setNewOrdersCount(unseenCount);
          }
        }
      } catch (error) {
        console.error('Error fetching new orders count:', error);
      }
    };

    fetchNewOrdersCount();
    
    // Listen for orderSeen events to update count immediately
    const handleOrderSeen = () => {
      fetchNewOrdersCount();
    };
    
    window.addEventListener('orderSeen', handleOrderSeen);
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchNewOrdersCount, 30000);
    
    return () => {
      window.removeEventListener('orderSeen', handleOrderSeen);
      clearInterval(interval);
    };
  }, [fetcher]);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
            <div className="flex h-16 items-center justify-between px-4">
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <button 
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                title="Close sidebar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const showBadge = item.name === 'Orders' && newOrdersCount > 0;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span className="flex-1">{item.name}</span>
                    {showBadge && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {newOrdersCount > 99 ? '99+' : newOrdersCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex h-16 items-center px-4">
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const showBadge = item.name === 'Orders' && newOrdersCount > 0;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span className="flex-1">{item.name}</span>
                    {showBadge && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {newOrdersCount > 99 ? '99+' : newOrdersCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <Link
                href="/"
                className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white rounded-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Back to Site
              </Link>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1"></div>
            </div>
          </div>

          {/* Page content */}
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
