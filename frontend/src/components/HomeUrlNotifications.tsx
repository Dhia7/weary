'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';

export default function HomeUrlNotifications() {
  const searchParams = useSearchParams();
  const { showOrderSuccess, showLoginSuccess, showLogoutSuccess } = useOrderNotification();

  useEffect(() => {
    const orderSuccess = searchParams.get('orderSuccess');
    const orderId = searchParams.get('orderId');

    if (orderSuccess === 'true') {
      showOrderSuccess(orderId || undefined);

      const url = new URL(window.location.href);
      url.searchParams.delete('orderSuccess');
      url.searchParams.delete('orderId');
      window.history.replaceState({}, '', url.toString());
    }

    const loginSuccess = searchParams.get('loginSuccess');
    const userName = searchParams.get('userName');

    if (loginSuccess === 'true') {
      showLoginSuccess(userName || undefined);

      const url = new URL(window.location.href);
      url.searchParams.delete('loginSuccess');
      url.searchParams.delete('userName');
      window.history.replaceState({}, '', url.toString());
    }

    const loggedOut = searchParams.get('loggedOut');
    const loggedOutUserName = searchParams.get('userName');

    if (loggedOut === '1') {
      showLogoutSuccess(loggedOutUserName || undefined);

      const url = new URL(window.location.href);
      url.searchParams.delete('loggedOut');
      if (loggedOutUserName) {
        url.searchParams.delete('userName');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, showOrderSuccess, showLoginSuccess, showLogoutSuccess]);

  return null;
}

