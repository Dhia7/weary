'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/contexts/LanguageContext';

function ConfirmationFallback() {
  return (
    <main className="pt-24 md:pt-28 pb-20 px-6 md:px-8 max-w-swisse mx-auto w-full">
      <div className="flex justify-center mb-12 md:mb-16">
        <div className="h-4 w-64 animate-pulse rounded bg-swisse-ink/10 dark:bg-muted" />
      </div>
      <div className="mx-auto max-w-lg rounded-md border border-swisse-gold/15 dark:border-border bg-white/40 dark:bg-card/50 p-10 md:p-14">
        <div className="mx-auto mb-6 h-12 w-12 animate-pulse rounded-full bg-swisse-ink/10 dark:bg-muted" />
        <div className="mx-auto h-8 w-3/4 max-w-sm animate-pulse rounded bg-swisse-ink/10 dark:bg-muted" />
        <div className="mx-auto mt-4 h-16 w-full animate-pulse rounded bg-swisse-ink/10 dark:bg-muted" />
      </div>
    </main>
  );
}

function CheckoutConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { language } = useLanguage();
  const isFrench = language === 'fr';

  return (
    <main className="pt-24 md:pt-28 pb-20 px-6 md:px-8 max-w-swisse mx-auto w-full">
      {/* Progress rail */}
      <div className="flex justify-center mb-12 md:mb-16">
        <nav className="flex items-center gap-8 md:gap-14">
          <Link
            href="/cart"
            className="relative text-[10px] uppercase tracking-[0.3em] text-swisse-ink/40 hover:text-swisse-ink dark:text-muted-foreground dark:hover:text-foreground transition-colors"
          >
            {isFrench ? 'Panier' : 'Cart'}
          </Link>
          <div className="w-8 h-px bg-swisse-ink/10 dark:bg-border" />
          <Link
            href="/checkout"
            className="relative text-[10px] uppercase tracking-[0.3em] text-swisse-ink/40 hover:text-swisse-ink dark:text-muted-foreground dark:hover:text-foreground transition-colors"
          >
            {isFrench ? 'Adresse / Paiement' : 'Address / Payment'}
          </Link>
          <div className="w-8 h-px bg-swisse-ink/10 dark:bg-border" />
          <span className="relative text-[10px] uppercase tracking-[0.3em] font-bold text-swisse-gold">
            {isFrench ? 'Confirmation' : 'Confirmation'}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-swisse-gold" />
          </span>
        </nav>
      </div>

      <div className="bg-white/60 dark:bg-card border border-swisse-gold/15 dark:border-border rounded-md p-10 md:p-14 text-center">
        <div className="mx-auto w-12 h-12 rounded-full border border-swisse-gold/30 flex items-center justify-center text-swisse-gold font-serif mb-6">
          ✓
        </div>
        <h1 className="font-serif text-2xl md:text-3xl uppercase tracking-[0.12em]">
          {isFrench ? 'Commande confirmée' : 'Order confirmed'}
        </h1>
        <p className="mt-4 text-sm text-swisse-ink/70 dark:text-muted-foreground leading-relaxed">
          {isFrench
            ? 'Merci ! Votre commande a été enregistrée. Notre équipe vous contactera pour les détails de livraison.'
            : 'Thank you! Your order has been placed. Our team will contact you for delivery details.'}
        </p>

        {orderId && (
          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground">
            {isFrench ? 'Numéro de commande' : 'Order ID'}: <span className="font-bold">{orderId}</span>
          </p>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="inline-block px-10 py-5 bg-swisse-gold text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-swisse-ink dark:hover:bg-primary transition-colors"
          >
            {isFrench ? "Retour à l'accueil" : 'Back to Home'}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutConfirmationPage() {
  return (
    <div className="min-h-screen bg-swisse-canvas text-swisse-ink dark:bg-background dark:text-foreground">
      <Navigation />
      <Suspense fallback={<ConfirmationFallback />}>
        <CheckoutConfirmationContent />
      </Suspense>
      <Footer />
    </div>
  );
}
