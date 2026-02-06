'use client';

import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import OrderSuccessNotification from './OrderSuccessNotification';
import LoginSuccessNotification from './LoginSuccessNotification';
import AddToCartNotification from './AddToCartNotification';
import AddToWishlistNotification from './AddToWishlistNotification';
import ErrorNotification from './ErrorNotification';
import PersonalizedTShirtOrderSuccessNotification from './PersonalizedTShirtOrderSuccessNotification';

export default function OrderNotificationWrapper() {
  const { notifications, hideNotification } = useOrderNotification();
  
  return (
    <>
      {notifications.map((notification, index) => {
        const commonProps = {
          isVisible: true,
          onClose: () => hideNotification(notification.id),
          index,
        };

        switch (notification.type) {
          case 'orderSuccess':
            return (
              <OrderSuccessNotification
                key={notification.id}
                {...commonProps}
                orderId={notification.data?.orderId}
              />
            );
          case 'loginSuccess':
            return (
              <LoginSuccessNotification
                key={notification.id}
                {...commonProps}
                userName={notification.data?.userName}
              />
            );
          case 'addToCart':
            return (
              <AddToCartNotification
                key={notification.id}
                {...commonProps}
                productName={notification.data?.productName}
              />
            );
          case 'wishlistAdded':
            return (
              <AddToWishlistNotification
                key={notification.id}
                {...commonProps}
                productName={notification.data?.productName}
              />
            );
          case 'error':
            return (
              <ErrorNotification
                key={notification.id}
                {...commonProps}
                message={notification.data?.message}
              />
            );
          case 'personalizedTShirtOrderSuccess':
            return (
              <PersonalizedTShirtOrderSuccessNotification
                key={notification.id}
                {...commonProps}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
