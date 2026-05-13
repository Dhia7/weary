import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CHUNK_RECOVERY_INLINE_SCRIPT } from "@/lib/chunkRecoveryInlineScript";
import { LANGUAGE_INLINE_SCRIPT } from "@/lib/languageInlineScript";
import { THEME_INLINE_SCRIPT } from "@/lib/themeInlineScript";
import type { Language } from "@/lib/contexts/LanguageContext";

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

function resolveInitialLanguage(value: string | undefined): Language {
  return value === "en" || value === "fr" ? value : "fr";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = resolveInitialLanguage(
    cookieStore.get("language")?.value
  );

  return (
    <html lang={initialLanguage} suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.fontshare.com" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: LANGUAGE_INLINE_SCRIPT }}
        />
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
        <Providers initialLanguage={initialLanguage}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
