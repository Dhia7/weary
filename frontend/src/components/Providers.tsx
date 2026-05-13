'use client';

import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { LanguageProvider, type Language } from "@/lib/contexts/LanguageContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { OrderNotificationProvider } from "@/lib/contexts/OrderNotificationContext";
import OrderNotificationWrapper from "@/components/OrderNotificationWrapper";

export function Providers({
  children,
  initialLanguage = "fr",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
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
    </LanguageProvider>
  );
}
