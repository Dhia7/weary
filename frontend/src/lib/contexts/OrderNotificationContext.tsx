'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface OrderNotificationContextType {
  showOrderSuccess: (orderId?: string) => void;
  hideOrderSuccess: () => void;
  isOrderSuccessVisible: boolean;
  orderId: string | undefined;
  showLoginSuccess: (userName?: string) => void;
  hideLoginSuccess: () => void;
  isLoginSuccessVisible: boolean;
  loginUserName: string | undefined;
  // Add-to-cart notification
  showAddToCart: (productName?: string) => void;
  hideAddToCart: () => void;
  isAddToCartVisible: boolean;
  addedProductName: string | undefined;
  // Wishlist notification
  showWishlistAdded: (productName?: string) => void;
  hideWishlistAdded: () => void;
  isWishlistAddedVisible: boolean;
  wishlistProductName: string | undefined;
  // Generic error notification
  showError: (message: string) => void;
  hideError: () => void;
  isErrorVisible: boolean;
  errorMessage: string | undefined;
  // Personalized t-shirt order success
  showPersonalizedTShirtOrderSuccess: () => void;
  hidePersonalizedTShirtOrderSuccess: () => void;
  isPersonalizedTShirtOrderSuccessVisible: boolean;
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
  const [isOrderSuccessVisible, setIsOrderSuccessVisible] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [isLoginSuccessVisible, setIsLoginSuccessVisible] = useState(false);
  const [loginUserName, setLoginUserName] = useState<string | undefined>(undefined);
  // Add-to-cart state
  const [isAddToCartVisible, setIsAddToCartVisible] = useState(false);
  const [addedProductName, setAddedProductName] = useState<string | undefined>(undefined);
  // Wishlist state
  const [isWishlistAddedVisible, setIsWishlistAddedVisible] = useState(false);
  const [wishlistProductName, setWishlistProductName] = useState<string | undefined>(undefined);
  // Error notification state
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  // Personalized t-shirt order success state
  const [isPersonalizedTShirtOrderSuccessVisible, setIsPersonalizedTShirtOrderSuccessVisible] = useState(false);

  const showOrderSuccess = (newOrderId?: string) => {
    setOrderId(newOrderId);
    setIsOrderSuccessVisible(true);
  };

  const hideOrderSuccess = () => {
    setIsOrderSuccessVisible(false);
    setOrderId(undefined);
  };

  const showLoginSuccess = (userName?: string) => {
    setLoginUserName(userName);
    setIsLoginSuccessVisible(true);
  };

  const hideLoginSuccess = () => {
    setIsLoginSuccessVisible(false);
    setLoginUserName(undefined);
  };

  // Add-to-cart handlers
  const showAddToCart = (productName?: string) => {
    setAddedProductName(productName);
    setIsAddToCartVisible(true);
  };

  const hideAddToCart = () => {
    setIsAddToCartVisible(false);
    setAddedProductName(undefined);
  };

  // Wishlist handlers
  const showWishlistAdded = (productName?: string) => {
    setWishlistProductName(productName);
    setIsWishlistAddedVisible(true);
  };

  const hideWishlistAdded = () => {
    setIsWishlistAddedVisible(false);
    setWishlistProductName(undefined);
  };

  // Error notification handlers
  const showError = (message: string) => {
    setErrorMessage(message);
    setIsErrorVisible(true);
  };

  const hideError = () => {
    setIsErrorVisible(false);
    setErrorMessage(undefined);
  };

  // Personalized t-shirt order success handlers
  const showPersonalizedTShirtOrderSuccess = () => {
    setIsPersonalizedTShirtOrderSuccessVisible(true);
  };

  const hidePersonalizedTShirtOrderSuccess = () => {
    setIsPersonalizedTShirtOrderSuccessVisible(false);
  };

  const value = {
    showOrderSuccess,
    hideOrderSuccess,
    isOrderSuccessVisible,
    orderId,
    showLoginSuccess,
    hideLoginSuccess,
    isLoginSuccessVisible,
    loginUserName,
    // add-to-cart
    showAddToCart,
    hideAddToCart,
    isAddToCartVisible,
    addedProductName,
    // wishlist
    showWishlistAdded,
    hideWishlistAdded,
    isWishlistAddedVisible,
    wishlistProductName,
    // error notification
    showError,
    hideError,
    isErrorVisible,
    errorMessage,
    // personalized t-shirt order success
    showPersonalizedTShirtOrderSuccess,
    hidePersonalizedTShirtOrderSuccess,
    isPersonalizedTShirtOrderSuccessVisible,
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
};
