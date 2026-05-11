import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CHUNK_RECOVERY_INLINE_SCRIPT } from "@/lib/chunkRecoveryInlineScript";
import { THEME_INLINE_SCRIPT } from "@/lib/themeInlineScript";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "Swissé — Premium fashion & lifestyle | Switzerland → Tunisia",
    template: "%s | Swissé",
  },
  description:
    "Curated international premium fashion and lifestyle, delivered across Tunisia in under a week. Official Switzerland→Tunisia import — authentic quality, no middlemen, honest prices in TND.",
  keywords: [
    "Swissé",
    "Swisse",
    "premium fashion Tunisia",
    "luxury shopping Tunisia",
    "Switzerland Tunisia import",
    "Swiss import Tunisia",
    "mode premium Tunisie",
    "lifestyle Tunisie",
    "livraison rapide Tunisie",
    "prix TND",
    "sans intermédiaires",
    "curated fashion",
    "international premium brands",
  ],
  openGraph: {
    type: "website",
    siteName: "Swissé",
    title:
      "Swissé — Premium fashion & lifestyle | Switzerland → Tunisia",
    description:
      "Curated international premium fashion and lifestyle in under a week. Official import to Tunisia — quality, elegance, fair TND prices.",
    locale: "en_US",
    alternateLocale: ["fr_TN", "fr_FR"],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Swissé — Premium fashion & lifestyle | Switzerland → Tunisia",
    description:
      "Curated premium fashion & lifestyle. Switzerland→Tunisia, delivery in under a week. Honest prices in TND.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
