import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { satoshi, zodiak } from "@/lib/fonts";
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
      "Swisia — Premium fashion & lifestyle | Switzerland → Tunisia",
    template: "%s | Swisia",
  },
  description:
    "Curated international premium fashion and lifestyle, delivered across Tunisia in under a week. Official Switzerland→Tunisia import — authentic quality, no middlemen, honest prices in TND.",
  keywords: [
    "Swisia",
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
    siteName: "Swisia",
    title:
      "Swisia — Premium fashion & lifestyle | Switzerland → Tunisia",
    description:
      "Curated international premium fashion and lifestyle in under a week. Official import to Tunisia — quality, elegance, fair TND prices.",
    locale: "en_US",
    alternateLocale: ["fr_TN", "fr_FR"],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Swisia — Premium fashion & lifestyle | Switzerland → Tunisia",
    description:
      "Curated premium fashion & lifestyle. Switzerland→Tunisia, delivery in under a week. Honest prices in TND.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
      </head>
      <body
        className={`${satoshi.variable} ${zodiak.variable} min-h-screen bg-swisse-canvas font-sans text-swisse-ink antialiased transition-colors duration-200`}
        suppressHydrationWarning={true}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-swisse-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-swisse-canvas"
        >
          Skip to main content
        </a>
        <Providers initialLanguage={initialLanguage}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
