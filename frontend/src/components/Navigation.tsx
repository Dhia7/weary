'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { scrollToHomeSection } from '@/lib/homeSectionNavigation';

const CartPanel = dynamic(() => import('./CartPanel'), { ssr: false });
const SearchAutocomplete = dynamic(() => import('./SearchAutocomplete'), {
  ssr: false,
  loading: () => (
    <div
      className="h-10 w-full rounded-md bg-swisse-mist/60 dark:bg-muted/40 animate-pulse"
      aria-hidden
    />
  ),
});

type MainNavItem = {
  name: string;
  href: string;
  sectionId?: string;
};

const mainNav: MainNavItem[] = [
  { name: 'Home', href: '/' },
  { name: 'Collections', href: '/products' },
  { name: 'Featured', href: '/products', sectionId: 'most-loved' },
  { name: 'About us', href: '/', sectionId: 'brand-story' },
];

const SCROLL_DELTA_PX = 8;
const TOP_REVEAL_PX = 16;
const SECTION_SCROLL_SETTLE_MS = 160;
const HEADER_SLIDE_MS = 700;
const MENU_SLIDE_MS = 420;

const Navigation = () => {
  const navRef = useRef<HTMLElement>(null);
  const pinHeaderRef = useRef(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isHeaderFocused, setIsHeaderFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuRendered, setIsMenuRendered] = useState(false);
  const [focusMenuSearch, setFocusMenuSearch] = useState(false);
  const cartOpenRef = useRef(false);
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const [isOverHero, setIsOverHero] = useState(pathname === '/');
  const [isScrollUpClear, setIsScrollUpClear] = useState(false);
  const router = useRouter();
  const isFrench = language === 'fr';
  cartOpenRef.current = isCartPanelOpen;

  const openMenu = (focusSearch = false) => {
    setIsCartPanelOpen(false);
    setIsMobileMenuOpen(true);
    if (focusSearch) setFocusMenuSearch(true);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    const userName = user?.firstName;
    logout();
    setIsMobileMenuOpen(false);
    const params = new URLSearchParams();
    params.set('loggedOut', '1');
    if (userName) {
      params.set('userName', userName);
    }
    router.push(`/?${params.toString()}`);
  };

  const isHome = pathname === '/';
  const isHeaderShown =
    !isHeaderHidden || isMobileMenuOpen || isCartPanelOpen || isHeaderFocused;
  const headerIsClear = (isHome && isOverHero) || isScrollUpClear;

  useEffect(() => {
    if (!isHome) {
      setIsOverHero(false);
      return;
    }

    const update = () => {
      const hero = document.getElementById('hero');
      const next = hero
        ? hero.getBoundingClientRect().bottom > 8
        : window.scrollY < 80;
      setIsOverHero((current) => (current === next ? current : next));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [isHome]);

  useEffect(() => {
    setIsHeaderHidden(false);
    setIsScrollUpClear(false);
    pinHeaderRef.current = false;
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen || !focusMenuSearch) return;

    let timer = 0;
    let attempts = 0;

    const tryFocus = () => {
      const input = document.querySelector('#site-menu input[type="search"]');
      if (input instanceof HTMLInputElement) {
        input.focus({ preventScroll: true });
        input.scrollIntoView({ block: 'nearest' });
        setFocusMenuSearch(false);
        return;
      }
      if (attempts >= 40) return;
      attempts += 1;
      timer = window.setTimeout(tryFocus, 50);
    };

    timer = window.setTimeout(tryFocus, 0);
    return () => window.clearTimeout(timer);
  }, [isMobileMenuOpen, focusMenuSearch]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    setIsMenuRendered(true);
    document.body.style.overflow = 'hidden';
    return () => {
      if (!cartOpenRef.current) document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMenuRendered) return;
    const panel = document.getElementById('site-menu');
    const backdrop = document.querySelector('.nav-menu-backdrop');
    if (!(panel instanceof HTMLElement) || !(backdrop instanceof HTMLElement)) return;

    const opening = isMobileMenuOpen;
    const duration = opening ? MENU_SLIDE_MS : 320;
    const easing = opening
      ? 'cubic-bezier(0.16, 1, 0.3, 1)'
      : 'cubic-bezier(0.4, 0, 1, 1)';

    const play = (
      element: HTMLElement,
      from: string,
      to: string,
      property: 'transform' | 'opacity'
    ) => {
      element.getAnimations().forEach((animation) => animation.cancel());
      const frames =
        property === 'transform'
          ? [{ transform: from }, { transform: to }]
          : [{ opacity: from }, { opacity: to }];
      const animation = element.animate(frames, { duration, easing, fill: 'forwards' });
      if (document.timeline.currentTime != null) {
        animation.startTime = document.timeline.currentTime;
      }
      return animation;
    };

    const panelFrom = getComputedStyle(panel).transform;
    const backdropFrom = getComputedStyle(backdrop).opacity;
    const panelAnimation = play(
      panel,
      panelFrom,
      opening ? 'translateX(0)' : 'translateX(-100%)',
      'transform'
    );
    play(backdrop, backdropFrom, opening ? '1' : '0', 'opacity');

    let cancelled = false;
    let timer = 0;
    if (!opening) {
      const finish = () => {
        if (!cancelled) setIsMenuRendered(false);
      };
      panelAnimation.finished.then(finish).catch(finish);
      timer = window.setTimeout(finish, duration + 80);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isMenuRendered, isMobileMenuOpen]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const onFocusIn = () => setIsHeaderFocused(true);
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && nav.contains(next)) return;
      setIsHeaderFocused(false);
    };

    nav.addEventListener('focusin', onFocusIn);
    nav.addEventListener('focusout', onFocusOut);
    return () => {
      nav.removeEventListener('focusin', onFocusIn);
      nav.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    let settleTimer = 0;
    let hidden = false;
    let lockUntil = 0;
    let pendingHidden: boolean | null = null;
    let pendingTimer = 0;
    let clearTimer = 0;

    const revealClear = () => {
      window.clearTimeout(clearTimer);
      setIsScrollUpClear(true);
    };

    const scheduleSolid = () => {
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => setIsScrollUpClear(false), 500);
    };

    const commitHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      lockUntil = performance.now() + (next ? 500 : HEADER_SLIDE_MS);
      setIsHeaderHidden(next);
    };

    const requestHidden = (next: boolean) => {
      if (next === hidden && pendingHidden === null) return;

      const now = performance.now();
      if (now < lockUntil) {
        pendingHidden = next;
        window.clearTimeout(pendingTimer);
        pendingTimer = window.setTimeout(() => {
          const queued = pendingHidden;
          pendingHidden = null;
          if (queued !== null) commitHidden(queued);
        }, lockUntil - now);
        return;
      }

      pendingHidden = null;
      commitHidden(next);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - lastY;

        if (pinHeaderRef.current) {
          lockUntil = 0;
          pendingHidden = null;
          window.clearTimeout(pendingTimer);
          commitHidden(false);
          lastY = y;
          window.clearTimeout(settleTimer);
          settleTimer = window.setTimeout(() => {
            pinHeaderRef.current = false;
          }, SECTION_SCROLL_SETTLE_MS);
          return;
        }

        if (y <= TOP_REVEAL_PX) {
          if (delta < 0) revealClear();
          lockUntil = 0;
          pendingHidden = null;
          window.clearTimeout(pendingTimer);
          commitHidden(false);
          lastY = y;
          return;
        }

        if (Math.abs(delta) <= SCROLL_DELTA_PX) return;

        if (delta < 0) revealClear();
        else scheduleSolid();
        requestHidden(delta > 0);
        lastY = y;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(pendingTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  const handleSectionNavClick = (
    item: MainNavItem,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!item.sectionId || !isHome) return;

    event.preventDefault();
    pinHeaderRef.current = true;
    setIsHeaderHidden(false);
    scrollToHomeSection(item.sectionId);
    setIsMobileMenuOpen(false);
  };

  const translatedMainNav = mainNav.map((item) => {
    if (!isFrench) return item;

    const translations: Record<string, string> = {
      Home: 'Accueil',
      Collections: 'Collections',
      Featured: 'Coups de coeur',
      'About us': 'À propos',
    };

    return { ...item, name: translations[item.name] ?? item.name };
  });

  return (
    <nav
      ref={navRef}
      aria-label={isFrench ? 'Navigation principale' : 'Primary navigation'}
      aria-hidden={isHeaderShown ? undefined : true}
      inert={isHeaderShown ? undefined : true}
      data-header-hidden={isHeaderShown ? undefined : true}
      className={`nav-header-slide fixed top-0 left-0 right-0 z-50 border-b will-change-transform ${
        headerIsClear
          ? 'border-transparent bg-transparent'
          : 'border-swisse-gold/15 bg-swisse-canvas dark:border-border dark:bg-background'
      } ${isHeaderShown ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-[4.25rem]">
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => {
                if (isMobileMenuOpen) closeMenu();
                else openMenu();
              }}
              className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-swisse-ink dark:text-foreground"
              aria-expanded={isMobileMenuOpen}
              aria-controls="site-menu"
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
            <button
              type="button"
              onClick={() => openMenu(true)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary transition-colors"
              aria-controls="site-menu"
              aria-label={isFrench ? 'Rechercher' : 'Search'}
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-16 md:h-[4.25rem] items-center justify-center">
            <Link
              href="/"
              aria-label={isFrench ? 'Swisia — Accueil' : 'Swisia — Home'}
              className="inline-flex h-full items-center"
            >
              <Image
                src="/images/logo-transparent.png"
                alt=""
                width={256}
                height={256}
                className={`h-full w-auto dark:hidden ${headerIsClear ? '' : 'hidden'}`}
                priority
              />
              <Image
                src="/images/logo.png"
                alt="Swisia"
                width={256}
                height={256}
                className={`h-full w-auto dark:hidden ${headerIsClear ? 'hidden' : ''}`}
                priority
              />
              <span className="hidden dark:block font-serif text-xl sm:text-2xl tracking-[0.2em] uppercase text-foreground">
                Swisia
              </span>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setIsCartPanelOpen(true);
              }}
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
                    onClick={handleLogout}
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
          </div>
        </div>
      </div>

      {isMenuRendered
        ? createPortal(
            <>
              <div
                className="nav-menu-backdrop fixed inset-0 z-[60] bg-black/60"
                onClick={closeMenu}
                aria-hidden="true"
              />
              <div
                id="site-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className="nav-menu-slide fixed inset-y-0 left-0 z-[70] flex h-[100dvh] w-full flex-col bg-swisse-canvas shadow-2xl dark:bg-background sm:max-w-md lg:max-w-lg"
              >
                <div className="flex items-center justify-between border-b border-swisse-gold/15 px-5 py-4 dark:border-border">
                  <p className="text-xs font-bold uppercase tracking-widest text-swisse-ink dark:text-foreground">
                    Menu
                  </p>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary"
                    aria-label={isFrench ? 'Fermer le menu' : 'Close menu'}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="px-5 pt-5">
                  <SearchAutocomplete placeholder={isFrench ? 'Rechercher…' : 'Search…'} />
                </div>
                <div className="mt-4 flex-1 overflow-y-auto px-5">
                  {translatedMainNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block border-b border-swisse-gold/10 py-3.5 text-xs font-bold uppercase tracking-widest text-swisse-ink hover:text-swisse-gold dark:border-border dark:text-foreground"
                      onClick={(event) => handleSectionNavClick(item, event)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-swisse-gold/15 px-5 py-5 dark:border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/50 dark:text-muted-foreground">
                    {isFrench ? 'Langue' : 'Language'}
                  </p>
                  <div
                    className="mt-2 flex gap-2"
                    role="group"
                    aria-label={isFrench ? 'Langue' : 'Language'}
                  >
                    <button
                      type="button"
                      aria-pressed={language === 'en'}
                      onClick={() => setLanguage('en')}
                      className={`inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-widest rounded border transition-colors ${
                        language === 'en'
                          ? 'border-swisse-gold text-swisse-gold'
                          : 'border-swisse-gold/30 text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      aria-pressed={language === 'fr'}
                      onClick={() => setLanguage('fr')}
                      className={`inline-flex min-h-11 items-center px-3 text-xs font-bold uppercase tracking-widest rounded border transition-colors ${
                        language === 'fr'
                          ? 'border-swisse-gold text-swisse-gold'
                          : 'border-swisse-gold/30 text-swisse-ink hover:text-swisse-gold dark:text-foreground dark:hover:text-primary'
                      }`}
                    >
                      French
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )
        : null}

      <CartPanel isOpen={isCartPanelOpen} onClose={() => setIsCartPanelOpen(false)} />
    </nav>
  );
};

export default Navigation;
