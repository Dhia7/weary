'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import SearchAutocomplete from './SearchAutocomplete';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { scrollToHomeSection } from '@/lib/homeSectionNavigation';

const CartPanel = dynamic(() => import('./CartPanel'), { ssr: false });

type MainNavItem = {
  name: string;
  href: string;
  sectionId?: string;
};

const mainNav: MainNavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Collections', href: '/collections', sectionId: 'collections' },
  { name: 'Featured', href: '/products', sectionId: 'most-loved' },
  { name: 'How it Works', href: '/about', sectionId: 'brand-story' },
];

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const { language, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const isFrench = language === 'fr';
  const isHome = pathname === '/';

  const handleSectionNavClick = (
    item: MainNavItem,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!item.sectionId || !isHome) return;

    event.preventDefault();
    scrollToHomeSection(item.sectionId);
    setIsMobileMenuOpen(false);
  };

  const translatedMainNav = mainNav.map((item) => {
    if (!isFrench) return item;

    const translations: Record<string, string> = {
      Home: 'Accueil',
      Collections: 'Collections',
      Featured: 'Coups de coeur',
      'How it Works': 'Comment ça marche',
    };

    return { ...item, name: translations[item.name] ?? item.name };
  });

  return (
    <nav aria-label={isFrench ? 'Navigation principale' : 'Primary navigation'} className="fixed top-0 left-0 right-0 z-50 border-b border-swisse-gold/15 bg-swisse-canvas/95 backdrop-blur-md dark:bg-background/95 dark:border-border">
      <div className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-[4.25rem]">
          <div className="flex-shrink-0">
            <Link href="/" className="font-serif text-xl sm:text-2xl tracking-[0.2em] uppercase text-swisse-ink dark:text-foreground">
              Swissé
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {translatedMainNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link"
                onClick={(event) => handleSectionNavClick(item, event)}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-4 lg:mx-8">
            <SearchAutocomplete placeholder={isFrench ? 'Rechercher…' : 'Search…'} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded border border-swisse-gold/30 text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary transition-colors"
              aria-label={isFrench ? 'Switch language to English' : 'Basculer la langue en francais'}
            >
              {isFrench ? 'FR' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => setIsCartPanelOpen(true)}
              className="relative inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary transition-colors"
              aria-label={isFrench ? 'Ouvrir le panier' : 'Open cart'}
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {totalQuantity > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-swisse-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative group">
                <Link
                  href="/account"
                  aria-label={isFrench ? 'Mon compte' : 'My account'}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary transition-colors"
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
                <div className="absolute right-0 mt-2 w-52 bg-swisse-canvas dark:bg-popover text-swisse-ink dark:text-popover-foreground rounded-md border border-swisse-gold/15 dark:border-border shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 text-sm border-b border-swisse-gold/10 dark:border-border">
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-swisse-ink/60 dark:text-muted-foreground">{user.email}</p>
                  </div>
                  {user.isAdmin && (
                    <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-swisse-mist dark:hover:bg-muted">
                      {isFrench ? 'Tableau de bord admin' : 'Admin Dashboard'}
                    </Link>
                  )}
                  <Link href="/account" className="block px-4 py-2 text-sm hover:bg-swisse-mist dark:hover:bg-muted">
                    {isFrench ? 'Mon compte' : 'My Account'}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-swisse-mist dark:hover:bg-muted"
                  >
                    {isFrench ? 'Se deconnecter' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                aria-label={isFrench ? 'Connexion' : 'Sign in'}
                className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary transition-colors"
              >
                <UserIcon className="h-6 w-6" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-swisse-ink dark:text-foreground"
              aria-label={
                isMobileMenuOpen
                  ? isFrench
                    ? 'Fermer le menu'
                    : 'Close menu'
                  : isFrench
                    ? 'Ouvrir le menu'
                    : 'Open menu'
              }
            >
              {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <SearchAutocomplete placeholder={isFrench ? 'Rechercher…' : 'Search…'} />
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-swisse-gold/15 dark:border-border bg-swisse-canvas dark:bg-background">
          <div className="max-w-swisse mx-auto px-4 py-4 space-y-1">
            {translatedMainNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-xs font-bold uppercase tracking-widest text-swisse-ink hover:text-swisse-gold dark:text-foreground"
                onClick={(event) => {
                  handleSectionNavClick(item, event);
                  setIsMobileMenuOpen(false);
                }}
              >
                {item.name}
              </Link>
            ))}
            {!user && (
              <div className="pt-4 border-t border-swisse-gold/10 dark:border-border space-y-2">
                <Link
                  href="/auth/login"
                  className="block text-xs font-bold uppercase tracking-widest text-swisse-ink"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isFrench ? 'Connexion' : 'Sign In'}
                </Link>
                <Link
                  href="/auth/signup"
                  className="block text-xs font-bold uppercase tracking-widest text-swisse-ink"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isFrench ? 'Creer un compte' : 'Create Account'}
                </Link>
              </div>
            )}
            {user && (
              <div className="pt-4 border-t border-swisse-gold/10 dark:border-border text-sm text-swisse-ink/80">
                <p className="font-medium text-swisse-ink">{user.firstName}</p>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 text-red-600 text-xs font-bold uppercase tracking-widest"
                >
                  {isFrench ? 'Se deconnecter' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isCartPanelOpen ? (
        <CartPanel isOpen={isCartPanelOpen} onClose={() => setIsCartPanelOpen(false)} />
      ) : null}
    </nav>
  );
};

export default Navigation;
