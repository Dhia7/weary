'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function CartPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since cart is now handled by the cart panel
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Cart Moved to Panel</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your cart is now available as a convenient right panel. Click the cart icon in the navigation to view your items.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you to the home page...
          </p>
        </div>
      </main>
    </div>
  );
}


