'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export type NotificationType = 
  | 'orderSuccess' 
  | 'loginSuccess' 
  | 'addToCart' 
  | 'wishlistAdded' 
  | 'error' 
  | 'personalizedTShirtOrderSuccess';

export interface Notification {
  id: string;
  type: NotificationType;
  data?: {
    orderId?: string;
    userName?: string;
    productName?: string;
    message?: string;
  };
}

interface OrderNotificationContextType {
  showOrderSuccess: (orderId?: string) => void;
  hideOrderSuccess: (id: string) => void;
  showLoginSuccess: (userName?: string) => void;
  hideLoginSuccess: (id: string) => void;
  // Add-to-cart notification
  showAddToCart: (productName?: string) => void;
  hideAddToCart: (id: string) => void;
  // Wishlist notification
  showWishlistAdded: (productName?: string) => void;
  hideWishlistAdded: (id: string) => void;
  // Generic error notification
  showError: (message: string) => void;
  hideError: (id: string) => void;
  clearAllErrors: () => void;
  // Personalized t-shirt order success
  showPersonalizedTShirtOrderSuccess: () => void;
  hidePersonalizedTShirtOrderSuccess: (id: string) => void;
  // Unified notification queue
  notifications: Notification[];
  hideNotification: (id: string) => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const useOrderNotification = () => {
  const context = useContext(OrderNotificationContext);
  if (context === undefined) {
    throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
  }
  return context;
};

interface OrderNotificationProviderProps {
  children: ReactNode;
}

export const OrderNotificationProvider = ({ children }: OrderNotificationProviderProps) => {
  // Unified notification queue - all notifications stack together
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = (type: NotificationType) => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
  };

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const showOrderSuccess = useCallback((orderId?: string) => {
    const id = generateId('orderSuccess');
    setNotifications(prev => [...prev, {
      id,
      type: 'orderSuccess',
      data: { orderId },
    }]);
  }, []);

  const hideOrderSuccess = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);

  const showLoginSuccess = useCallback((userName?: string) => {
    const id = generateId('loginSuccess');
    setNotifications(prev => [...prev, {
      id,
      type: 'loginSuccess',
      data: { userName },
    }]);
  }, []);

  const hideLoginSuccess = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);

  // Add-to-cart handlers
  const showAddToCart = useCallback((productName?: string) => {
    const id = generateId('addToCart');
    setNotifications(prev => [...prev, {
      id,
      type: 'addToCart',
      data: { productName },
    }]);
  }, []);

  const hideAddToCart = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);

  // Wishlist handlers
  const showWishlistAdded = useCallback((productName?: string) => {
    const id = generateId('wishlistAdded');
    setNotifications(prev => [...prev, {
      id,
      type: 'wishlistAdded',
      data: { productName },
    }]);
  }, []);

  const hideWishlistAdded = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);

  // Error notification handlers
  const showError = useCallback((message: string) => {
    const id = generateId('error');
    setNotifications(prev => [...prev, {
      id,
      type: 'error',
      data: { message },
    }]);
  }, []);

  const hideError = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);

  const clearAllErrors = useCallback(() => {
    setNotifications(prev => prev.filter(notif => notif.type !== 'error'));
  }, []);

  // Personalized t-shirt order success handlers
  const showPersonalizedTShirtOrderSuccess = useCallback(() => {
    const id = generateId('personalizedTShirtOrderSuccess');
    setNotifications(prev => [...prev, {
      id,
      type: 'personalizedTShirtOrderSuccess',
    }]);
  }, []);

  const hidePersonalizedTShirtOrderSuccess = useCallback((id: string) => {
    hideNotification(id);
  }, [hideNotification]);

  const value = useMemo(() => ({
    showOrderSuccess,
    hideOrderSuccess,
    showLoginSuccess,
    hideLoginSuccess,
    showAddToCart,
    hideAddToCart,
    showWishlistAdded,
    hideWishlistAdded,
    showError,
    hideError,
    clearAllErrors,
    showPersonalizedTShirtOrderSuccess,
    hidePersonalizedTShirtOrderSuccess,
    notifications,
    hideNotification,
  }), [
    showOrderSuccess,
    hideOrderSuccess,
    showLoginSuccess,
    hideLoginSuccess,
    showAddToCart,
    hideAddToCart,
    showWishlistAdded,
    hideWishlistAdded,
    showError,
    hideError,
    clearAllErrors,
    showPersonalizedTShirtOrderSuccess,
    hidePersonalizedTShirtOrderSuccess,
    notifications,
    hideNotification,
  ]);

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
};
