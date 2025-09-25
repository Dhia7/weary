'use client';

import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import OrderSuccessNotification from './OrderSuccessNotification';
import LoginSuccessNotification from './LoginSuccessNotification';
import AddToCartNotification from './AddToCartNotification';
import AddToWishlistNotification from './AddToWishlistNotification';

export default function OrderNotificationWrapper() {
  const { 
    isOrderSuccessVisible, 
    hideOrderSuccess, 
    orderId,
    isLoginSuccessVisible,
    hideLoginSuccess,
    loginUserName,
    // add-to-cart
    isAddToCartVisible,
    hideAddToCart,
    addedProductName,
    // wishlist
    isWishlistAddedVisible,
    hideWishlistAdded,
    wishlistProductName,
  } = useOrderNotification();
  
  return (
    <>
      <OrderSuccessNotification
        isVisible={isOrderSuccessVisible}
        onClose={hideOrderSuccess}
        orderId={orderId}
      />
      <LoginSuccessNotification
        isVisible={isLoginSuccessVisible}
        onClose={hideLoginSuccess}
        userName={loginUserName}
      />
      <AddToCartNotification
        isVisible={isAddToCartVisible}
        onClose={hideAddToCart}
        productName={addedProductName}
      />
      <AddToWishlistNotification
        isVisible={isWishlistAddedVisible}
        onClose={hideWishlistAdded}
        productName={wishlistProductName}
      />
    </>
  );
}
