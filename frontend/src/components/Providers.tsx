'use client';

import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { OrderNotificationProvider } from "@/lib/contexts/OrderNotificationContext";
import OrderNotificationWrapper from "@/components/OrderNotificationWrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <OrderNotificationProvider>
              {children}
              <OrderNotificationWrapper />
            </OrderNotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
