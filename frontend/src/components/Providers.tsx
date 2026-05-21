'use client';

import { SWRConfig } from 'swr';
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { LanguageProvider, type Language } from "@/lib/contexts/LanguageContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { OrderNotificationProvider } from "@/lib/contexts/OrderNotificationContext";
import DeferredOrderNotifications from "@/components/DeferredOrderNotifications";
import { defaultSwrConfig } from "@/lib/swr/config";
import { jsonFetcher } from "@/lib/swr/fetcher";

export function Providers({
  children,
  initialLanguage = "fr",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  return (
    <SWRConfig value={{ ...defaultSwrConfig, fetcher: jsonFetcher }}>
      <LanguageProvider initialLanguage={initialLanguage}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <OrderNotificationProvider>
                  {children}
                  <DeferredOrderNotifications />
                </OrderNotificationProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SWRConfig>
  );
}
