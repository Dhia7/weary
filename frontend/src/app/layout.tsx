import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CHUNK_RECOVERY_INLINE_SCRIPT } from "@/lib/chunkRecoveryInlineScript";
import { THEME_INLINE_SCRIPT } from "@/lib/themeInlineScript";

export const metadata: Metadata = {
  title: "SWISSÉ — Luxury Craftsmanship",
  description:
    "Swissé — timeless elegance and Swiss artistry. Hand-finished luxury fashion and accessories.",
  keywords:
    "Swissé, luxury fashion, Swiss craftsmanship, premium clothing, curated collections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY_INLINE_SCRIPT }}
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=zodiak@400,500,700&f[]=satoshi@300,400,500,700&display=swap"
        />
      </head>
      <body
        className="min-h-screen bg-swisse-canvas text-swisse-ink antialiased transition-colors duration-200"
        suppressHydrationWarning={true}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
