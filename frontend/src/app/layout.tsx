import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { OrderNotificationProvider } from "@/lib/contexts/OrderNotificationContext";
import OrderNotificationWrapper from "@/components/OrderNotificationWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StyleHub - Premium Clothing Marketplace",
  description: "Discover unique fashion pieces from independent designers and creators. Shop the latest trends in clothing, accessories, and more.",
  keywords: "clothing, fashion, ecommerce, marketplace, designer clothes, unique fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`} suppressHydrationWarning={true}>
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
      </body>
    </html>
  );
}

