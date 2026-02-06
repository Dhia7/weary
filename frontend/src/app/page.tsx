'use client';

import { useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import TrustIndicators from '@/components/TrustIndicators';
import Footer from '@/components/Footer';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';

// Lazy load below-the-fold components for better initial page load
const FeaturedProducts = lazy(() => import('@/components/FeaturedProducts'));
const Categories = lazy(() => import('@/components/Categories'));
const Collections = lazy(() => import('@/components/Collections'));
const NewsletterSignup = lazy(() => import('@/components/NewsletterSignup'));

function HomeContent() {
  const searchParams = useSearchParams();
  const { showOrderSuccess, showLoginSuccess } = useOrderNotification();

  useEffect(() => {
    // Check if user came from a successful checkout
    const orderSuccess = searchParams.get('orderSuccess');
    const orderId = searchParams.get('orderId');
    
    if (orderSuccess === 'true') {
      showOrderSuccess(orderId || undefined);
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('orderSuccess');
      url.searchParams.delete('orderId');
      window.history.replaceState({}, '', url.toString());
    }

    // Check if user came from a successful login
    const loginSuccess = searchParams.get('loginSuccess');
    const userName = searchParams.get('userName');
    
    if (loginSuccess === 'true') {
      showLoginSuccess(userName || undefined);
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('loginSuccess');
      url.searchParams.delete('userName');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, showOrderSuccess, showLoginSuccess]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <Hero />
      <TrustIndicators />
      
      <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
        <FeaturedProducts />
      </Suspense>
      
      <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
        <Categories />
      </Suspense>
      
      <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
        <Collections />
      </Suspense>
      
      <Suspense fallback={<div className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
        <NewsletterSignup />
      </Suspense>
      
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}> 
      <HomeContent />
    </Suspense>
  );
}
