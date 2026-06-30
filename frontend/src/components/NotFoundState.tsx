'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export interface NotFoundStateProps {
  title: string;
  description?: string;
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  backLabel?: string;
  homeLabel?: string;
  homeHref?: string;
  showBack?: boolean;
}

export default function NotFoundState({
  title,
  description,
  code = '404',
  onRetry,
  retryLabel = 'Try Again',
  backLabel = 'Go Back',
  homeLabel = 'Go Home',
  homeHref = '/',
  showBack = true,
}: NotFoundStateProps) {
  return (
    <div className="min-h-screen bg-swisse-canvas text-swisse-ink dark:bg-background dark:text-foreground flex flex-col">
      <Navigation />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-28 pb-16"
      >
        <div className="w-full max-w-lg text-center">
          <p
            aria-hidden
            className="font-serif text-8xl sm:text-9xl text-swisse-gold/40 dark:text-primary/30 leading-none mb-4 select-none"
          >
            {code}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-swisse-ink dark:text-foreground mb-4">
            {title}
          </h1>
          {description ? (
            <p className="text-swisse-ink/70 dark:text-muted-foreground leading-relaxed mb-10 max-w-md mx-auto">
              {description}
            </p>
          ) : (
            <div className="mb-10" />
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-swisse-ink hover:bg-swisse-gold text-swisse-canvas text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 dark:bg-foreground dark:text-background dark:hover:bg-primary"
              >
                {retryLabel}
              </button>
            )}
            <Link
              href={homeHref}
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                onRetry
                  ? 'border border-swisse-gold/30 text-swisse-ink hover:border-swisse-gold hover:text-swisse-gold dark:text-foreground'
                  : 'bg-swisse-ink hover:bg-swisse-gold text-swisse-canvas dark:bg-foreground dark:text-background dark:hover:bg-primary'
              }`}
            >
              <Home className="w-4 h-4" />
              {homeLabel}
            </Link>
            {showBack && !onRetry && (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-swisse-gold/30 text-swisse-ink hover:border-swisse-gold hover:text-swisse-gold dark:text-foreground text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
