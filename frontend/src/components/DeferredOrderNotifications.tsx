'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const OrderNotificationWrapper = dynamic(
  () => import('@/components/OrderNotificationWrapper'),
  { ssr: false }
);

export default function DeferredOrderNotifications() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 3000,
      });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <OrderNotificationWrapper />;
}
