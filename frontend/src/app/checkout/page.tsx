'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { getCartItemKey, useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getDelegationsForGovernorate } from '@/data/tunisiaDelegations';
import { fetchLocalitiesForDelegation, type LocalityOption } from '@/lib/fetchTunisiaLocalities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const formatPrice = (price: number | string) => `${Number(price).toFixed(2)} TND`;

/** Fixed for this checkout flow (Tunisia-only address steps). */
const CHECKOUT_COUNTRY = 'Tunisia';

/** Stored in `shippingAddress.city` for backend compatibility. */
const TUNISIA_GOVERNORATES = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Le Kef',
  'Mahdia',
  'La Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
] as const;

type ProfileAddress = {
  id?: number;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
};

type ProfileUser = {
  fullName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  addresses?: ProfileAddress[];
};

function isTunisiaCountry(country: string): boolean {
  const normalized = country.trim().toLowerCase();
  return normalized === 'tunisia' || normalized === 'tunisie' || normalized === 'tn';
}

function getProfileDefaults(user: ProfileUser) {
  const fullName = user.fullName?.trim() || `${user.firstName} ${user.lastName}`.trim();
  const billing = { phone: user.phone ?? '', phoneAlt: '', email: user.email };

  let address = { street: '', city: '', state: '', locality: '' };
  const saved = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];
  if (saved && isTunisiaCountry(saved.country)) {
    const street = saved.street?.trim() ?? '';
    let city = '';
    let state = '';
    if ((TUNISIA_GOVERNORATES as readonly string[]).includes(saved.city)) {
      city = saved.city;
      const delegations = getDelegationsForGovernorate(city);
      if (saved.state?.trim() && delegations.includes(saved.state)) {
        state = saved.state;
      }
    }
    address = { street, city, state, locality: '' };
  }

  return { fullName, billing, address };
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { token, user, isLoading: authLoading } = useAuth();
  const { showOrderSuccess } = useOrderNotification();
  const router = useRouter();
  const { language } = useLanguage();
  const isFrench = language === 'fr';
  const [fullName, setFullName] = useState('');
  const [billing, setBilling] = useState({ phone: '', phoneAlt: '', email: '' });
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    locality: '',
  });
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [govPickerOpen, setGovPickerOpen] = useState(false);
  const [delPickerOpen, setDelPickerOpen] = useState(false);
  const [locPickerOpen, setLocPickerOpen] = useState(false);
  const govPickerRef = useRef<HTMLDivElement>(null);
  const delPickerRef = useRef<HTMLDivElement>(null);
  const locPickerRef = useRef<HTMLDivElement>(null);
  const prefilledRef = useRef(false);
  const [localityRows, setLocalityRows] = useState<LocalityOption[]>([]);
  const [localityLoading, setLocalityLoading] = useState(false);
  const [localityError, setLocalityError] = useState<string | null>(null);
  const FREE_SHIPPING_THRESHOLD_TND = 100;
  const qualifiesForFreeShipping = subtotal > FREE_SHIPPING_THRESHOLD_TND;
  const baseDeliveryCost = 10;
  const deliveryCost = qualifiesForFreeShipping ? 0 : baseDeliveryCost;
  const hasItems = items.length > 0;

  const payloadItems = useMemo(() =>
    items.map(i => ({ 
      productId: i.productId || i.id.split('-')[0],
      quantity: i.quantity, 
      unitPriceCents: Math.round(i.price * 100),
      size: i.size || null,
      color: i.color || null,
      variantId: i.variantId ? parseInt(i.variantId, 10) : null,
    })),
  [items]);

  const nameParts = useMemo(() => {
    const trimmed = fullName.trim();
    if (!trimmed) return { firstName: '', lastName: '' };
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }, [fullName]);

  const delegationOptions = useMemo(
    () => (address.city ? [...getDelegationsForGovernorate(address.city)] : []),
    [address.city]
  );

  const applyProfileDefaults = useCallback((profileUser: ProfileUser) => {
    const defaults = getProfileDefaults(profileUser);
    setFullName(defaults.fullName);
    setBilling(defaults.billing);
    setAddress(defaults.address);
    setError(null);
  }, []);

  const resetToAccountDetails = () => {
    if (!user) return;
    applyProfileDefaults(user);
  };

  useEffect(() => {
    if (authLoading || !user || prefilledRef.current) return;

    const formEmpty = !fullName.trim() && !billing.email.trim() && !billing.phone.trim();
    if (!formEmpty) return;

    applyProfileDefaults(user);
    prefilledRef.current = true;
  }, [authLoading, user, fullName, billing.email, billing.phone, applyProfileDefaults]);

  useEffect(() => {
    if (!govPickerOpen && !delPickerOpen && !locPickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (govPickerOpen && govPickerRef.current && !govPickerRef.current.contains(t)) {
        setGovPickerOpen(false);
      }
      if (delPickerOpen && delPickerRef.current && !delPickerRef.current.contains(t)) {
        setDelPickerOpen(false);
      }
      if (locPickerOpen && locPickerRef.current && !locPickerRef.current.contains(t)) {
        setLocPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [govPickerOpen, delPickerOpen, locPickerOpen]);

  useEffect(() => {
    if (!address.city || !address.state) {
      setLocalityRows([]);
      setLocalityError(null);
      setLocalityLoading(false);
      return;
    }
    const ac = new AbortController();
    setLocalityLoading(true);
    setLocalityError(null);
    setLocalityRows([]);
    fetchLocalitiesForDelegation(address.city, address.state, ac.signal)
      .then((rows) => {
        if (!ac.signal.aborted) setLocalityRows(rows);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setLocalityError(err instanceof Error ? err.message : 'fetch failed');
        setLocalityRows([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLocalityLoading(false);
      });
    return () => ac.abort();
  }, [address.city, address.state]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const placeOrder = async () => {
    if (!hasItems) return;
    if (!nameParts.firstName || !billing.phone || !billing.email) {
      setError(
        isFrench
          ? 'Veuillez renseigner le nom du destinataire, le téléphone et l’email.'
          : 'Please fill in recipient name, phone and email.'
      );
      return;
    }
    if (!address.city) {
      setError(
        isFrench ? 'Veuillez sélectionner un gouvernorat.' : 'Please select a governorate.'
      );
      return;
    }
    if (!address.state?.trim()) {
      setError(
        isFrench ? 'Veuillez sélectionner une délégation.' : 'Please select a delegation.'
      );
      return;
    }
    if (!address.locality?.trim()) {
      setError(
        isFrench ? 'Veuillez indiquer une localité.' : 'Please select or enter a locality.'
      );
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      // Use guest checkout endpoint if not authenticated, otherwise use authenticated endpoint
      const endpoint = token ? '/products/checkout/cod' : '/products/checkout/guest';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only add authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const shippingAddress = {
        street: address.street.trim(),
        city: address.city,
        state: address.state,
        locality: address.locality.trim(),
        zipCode: '',
        country: CHECKOUT_COUNTRY,
      };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: payloadItems,
          shippingAddress,
          currency: 'TND',
          shippingCostCents: Math.round(deliveryCost * 100),
          billingInfo: {
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            phone: billing.phone,
            phoneAlt: billing.phoneAlt || undefined,
            email: billing.email,
          },
          notes
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (isFrench ? 'Impossible de passer la commande' : 'Failed to place order'));
        return;
      }
      clearCart();

      const orderId = data.data?.order?.id ?? data.orderId ?? data.id;
      showOrderSuccess(orderId ? String(orderId) : undefined);

      const qs = orderId ? `?orderId=${encodeURIComponent(String(orderId))}` : '';
      router.push(`/checkout/confirmation${qs}`);
  } catch {
      setError(isFrench ? 'Erreur réseau. Veuillez réessayer.' : 'Network error. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const displayItems = useMemo(
    () =>
      items.map((i) => ({
        key: getCartItemKey(i),
        name: i.name,
        size: i.size,
        color: i.color,
        qty: i.quantity,
        price: i.price * i.quantity,
        image: i.image,
      })),
    [items]
  );

  return (
    <div className="min-h-screen bg-swisse-canvas text-swisse-ink dark:bg-background dark:text-foreground">
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 700ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 700ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .swisse-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .swisse-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(197, 160, 89, 0.4);
          border-radius: 10px;
        }
      `}</style>
      <Navigation />
      <main className="pt-24 md:pt-28 pb-20 px-6 md:px-8 max-w-swisse mx-auto w-full">
        <div className="flex items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl uppercase tracking-[0.12em]">{isFrench ? 'Paiement' : 'Checkout'}</h1>
            <p className="text-sm text-swisse-ink/60 dark:text-muted-foreground mt-3">
              {isFrench ? 'Coordonnées de livraison et confirmation du paiement.' : 'Shipping details and payment confirmation.'}
            </p>
          </div>
          <div className="hidden md:block text-xs uppercase tracking-[0.3em] text-swisse-ink/50 dark:text-muted-foreground">
            {isFrench ? 'Paiement sécurisé' : 'Secure checkout'}
          </div>
        </div>
        
        {!token && (
          <div className="border border-swisse-gold/20 bg-white/40 dark:bg-card/50 rounded-md px-5 py-4 mb-10">
            <p className="text-xs uppercase tracking-[0.22em] font-bold text-swisse-ink/70 dark:text-muted-foreground">
              {isFrench ? 'Paiement invité activé' : 'Guest checkout enabled'}
            </p>
            <p className="text-sm text-swisse-ink/70 dark:text-muted-foreground mt-2 leading-relaxed">
              {isFrench
                ? 'Vous pouvez passer commande sans créer de compte. L’administrateur suivra votre commande grâce à votre adresse email.'
                : 'You can place an order without creating an account. Admin will track your order using your email address.'}
            </p>
          </div>
        )}

        {token && user && (
          <div className="border border-swisse-gold/20 bg-white/40 dark:bg-card/50 rounded-md px-5 py-4 mb-10">
            <p className="text-xs uppercase tracking-[0.22em] font-bold text-swisse-ink/70 dark:text-muted-foreground">
              {isFrench ? 'Compte connecté' : 'Signed in'}
            </p>
            <p className="text-sm text-swisse-ink/70 dark:text-muted-foreground mt-2 leading-relaxed">
              {isFrench
                ? 'Vos coordonnées de compte sont préremplies. Vous offrez un cadeau ? Modifiez le nom et les coordonnées du destinataire ci-dessous.'
                : 'Your account details are pre-filled. Sending a gift? Update the recipient name and contact info below.'}
            </p>
          </div>
        )}

        {!hasItems ? (
          <div className="bg-white/60 dark:bg-card border border-swisse-gold/15 dark:border-border rounded-md p-10 text-center">
            <p className="text-swisse-ink/70 dark:text-muted-foreground mb-6">{isFrench ? 'Votre panier est vide.' : 'Your cart is empty.'}</p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-swisse-gold text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-swisse-ink dark:hover:bg-primary transition-colors"
            >
              {isFrench ? 'Continuer vos achats' : 'Continue Shopping'}
            </Link>
          </div>
        ) : (
          <>
            {/* Progress rail */}
            <div className="flex justify-center mb-14 md:mb-20">
              <nav className="flex items-center gap-8 md:gap-14">
                <Link
                  href="/cart"
                  className="relative text-[10px] uppercase tracking-[0.3em] text-swisse-ink/40 hover:text-swisse-ink dark:text-muted-foreground dark:hover:text-foreground transition-colors"
                >
                  {isFrench ? 'Panier' : 'Cart'}
                </Link>
                <div className="w-8 h-px bg-swisse-ink/10 dark:bg-border" />
                <span className="relative text-[10px] uppercase tracking-[0.3em] font-bold text-swisse-gold">
                  {isFrench ? 'Adresse / Paiement' : 'Address / Payment'}
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-swisse-gold" />
                </span>
                <div className="w-8 h-px bg-swisse-ink/10 dark:bg-border" />
                <span className="relative text-[10px] uppercase tracking-[0.3em] text-swisse-ink/40 dark:text-muted-foreground">
                  {isFrench ? 'Confirmation' : 'Confirmation'}
                </span>
              </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Form column */}
              <div className="lg:col-span-7 space-y-14">
                {/* Shipping address */}
                <section data-reveal className="reveal">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <span className="text-swisse-gold font-serif text-xl italic">01</span>
                      <h2 className="font-serif text-2xl md:text-3xl uppercase tracking-[0.12em]">
                        {isFrench ? 'Adresse de livraison' : 'Shipping Address'}
                      </h2>
                    </div>
                    {user && (
                      <button
                        type="button"
                        onClick={resetToAccountDetails}
                        className="text-[10px] uppercase tracking-[0.22em] font-bold text-swisse-gold hover:text-swisse-ink dark:hover:text-foreground transition-colors shrink-0"
                      >
                        {isFrench ? 'Réinitialiser' : 'Reset to my details'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="checkout-full-name" className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1">
                        {isFrench ? 'Nom du destinataire' : 'Recipient name'}
                      </label>
                      <input
                        id="checkout-full-name"
                        type="text"
                        autoComplete="name"
                        placeholder={
                          isFrench
                            ? 'Nom de la personne qui recevra la commande'
                            : 'Name of the person receiving the order'
                        }
                        className="w-full py-4 px-6 text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                      <p className="text-xs text-swisse-ink/50 dark:text-muted-foreground ml-1">
                        {isFrench
                          ? 'Pour un cadeau, saisissez le nom et les coordonnées du destinataire.'
                          : 'For a gift, enter the recipient’s name and contact details.'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="checkout-email" className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1">
                        {isFrench ? 'Adresse email' : 'Email Address'}
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        placeholder={isFrench ? 'email@domaine.com' : 'email@domain.com'}
                        className="w-full py-4 px-6 text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                        value={billing.email}
                        onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="checkout-phone" className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1">
                        {isFrench ? 'Numéro de téléphone' : 'Phone Number'}
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="28700123"
                        className="w-full py-4 px-6 text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                        value={billing.phone}
                        onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="checkout-street" className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1">
                        {isFrench ? 'Adresse (facultatif)' : 'Street Address (optional)'}
                      </label>
                      <input
                        id="checkout-street"
                        type="text"
                        autoComplete="street-address"
                        placeholder={isFrench ? 'Appartement, immeuble, rue…' : 'Apt, suite, building, street (optional)'}
                        className="w-full py-4 px-6 text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2" ref={govPickerRef}>
                      <label
                        id="governorate-label"
                        htmlFor="governorate-toggle"
                        className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1"
                      >
                        {isFrench ? 'Gouvernorat (Tunisie)' : 'Governorate (Tunisia)'}
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          id="governorate-toggle"
                          aria-labelledby="governorate-label"
                          onClick={() => setGovPickerOpen((o) => !o)}
                          className="flex w-full items-center justify-between gap-4 py-4 px-6 text-left text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border transition-colors hover:border-swisse-gold/40 focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                        >
                          <span className={address.city ? 'text-swisse-ink dark:text-foreground' : 'text-swisse-ink/45 dark:text-muted-foreground'}>
                            {address.city
                              ? address.city
                              : isFrench
                                ? 'Choisir le gouvernorat…'
                                : 'Choose governorate…'}
                          </span>
                          <ChevronDownIcon
                            className={`h-5 w-5 shrink-0 text-swisse-ink/50 transition-transform ${govPickerOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                        </button>
                        {govPickerOpen && (
                          <ul
                            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto swisse-scrollbar border border-swisse-ink/10 bg-white py-1 shadow-lg dark:border-border dark:bg-card"
                          >
                            {TUNISIA_GOVERNORATES.map((gov) => {
                              const selected = address.city === gov;
                              return (
                                <li key={gov}>
                                  <button
                                    type="button"
                                    className={`w-full px-5 py-2.5 text-left text-sm transition-colors ${
                                      selected
                                        ? 'bg-swisse-gold/15 font-semibold text-swisse-ink dark:text-foreground'
                                        : 'text-swisse-ink hover:bg-swisse-mist/80 dark:text-foreground dark:hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      setAddress((prev) => ({ ...prev, city: gov, state: '', locality: '' }));
                                      setGovPickerOpen(false);
                                      setDelPickerOpen(false);
                                      setLocPickerOpen(false);
                                    }}
                                  >
                                    {gov}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div
                      className={`md:col-span-2 space-y-2 ${!address.city ? 'pointer-events-none opacity-50' : ''}`}
                      ref={delPickerRef}
                    >
                      <label
                        id="delegation-label"
                        htmlFor="delegation-toggle"
                        className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1"
                      >
                        {isFrench ? 'Délégation' : 'Delegation'}
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          id="delegation-toggle"
                          aria-labelledby="delegation-label"
                          disabled={!address.city || delegationOptions.length === 0}
                          onClick={() => {
                            if (!address.city || delegationOptions.length === 0) return;
                            setDelPickerOpen((o) => !o);
                          }}
                          className="flex w-full items-center justify-between gap-4 py-4 px-6 text-left text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border transition-colors hover:border-swisse-gold/40 focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none disabled:cursor-not-allowed"
                        >
                          <span
                            className={
                              address.state
                                ? 'text-swisse-ink dark:text-foreground'
                                : 'text-swisse-ink/45 dark:text-muted-foreground'
                            }
                          >
                            {!address.city
                              ? isFrench
                                ? 'Choisissez d’abord un gouvernorat'
                                : 'Choose a governorate first'
                              : address.state
                                ? address.state
                                : isFrench
                                  ? 'Choisir la délégation…'
                                  : 'Choose delegation…'}
                          </span>
                          <ChevronDownIcon
                            className={`h-5 w-5 shrink-0 text-swisse-ink/50 transition-transform ${delPickerOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                        </button>
                        {delPickerOpen && address.city && delegationOptions.length > 0 && (
                          <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto swisse-scrollbar border border-swisse-ink/10 bg-white py-1 shadow-lg dark:border-border dark:bg-card">
                            {delegationOptions.map((del) => {
                              const selected = address.state === del;
                              return (
                                <li key={del}>
                                  <button
                                    type="button"
                                    className={`w-full px-5 py-2.5 text-left text-sm transition-colors ${
                                      selected
                                        ? 'bg-swisse-gold/15 font-semibold text-swisse-ink dark:text-foreground'
                                        : 'text-swisse-ink hover:bg-swisse-mist/80 dark:text-foreground dark:hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      setAddress((prev) => ({ ...prev, state: del, locality: '' }));
                                      setDelPickerOpen(false);
                                      setLocPickerOpen(false);
                                    }}
                                  >
                                    {del}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div
                      className={`md:col-span-2 space-y-2 ${!address.state ? 'pointer-events-none opacity-50' : ''}`}
                      ref={locPickerRef}
                    >
                      <label
                        id="locality-label"
                        className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1"
                      >
                        {isFrench ? 'Localité' : 'Locality'}
                      </label>
                      {localityError && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {isFrench
                            ? `Liste indisponible (${localityError}). Ouvrez le menu pour saisir la localité.`
                            : `List unavailable (${localityError}). Open the menu to type your locality.`}
                        </p>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          aria-labelledby="locality-label"
                          disabled={!address.state || localityLoading}
                          onClick={() => {
                            if (!address.state || localityLoading) return;
                            setLocPickerOpen((o) => !o);
                          }}
                          className="flex w-full min-h-[3.25rem] items-center justify-between gap-4 py-4 px-6 text-left text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border transition-colors hover:border-swisse-gold/40 focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none disabled:cursor-not-allowed"
                        >
                          <span
                            className={`line-clamp-2 ${
                              address.locality
                                ? 'text-swisse-ink dark:text-foreground'
                                : 'text-swisse-ink/45 dark:text-muted-foreground'
                            }`}
                          >
                            {localityLoading
                              ? isFrench
                                ? 'Chargement des localités…'
                                : 'Loading localities…'
                              : address.locality
                                ? address.locality
                                : isFrench
                                  ? 'Choisir la localité…'
                                  : 'Choose locality…'}
                          </span>
                          <ChevronDownIcon
                            className={`h-5 w-5 shrink-0 text-swisse-ink/50 transition-transform ${locPickerOpen ? 'rotate-180' : ''}`}
                            aria-hidden
                          />
                        </button>
                        {locPickerOpen && !localityLoading && (
                          <ul className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto swisse-scrollbar border border-swisse-ink/10 bg-white py-1 shadow-lg dark:border-border dark:bg-card">
                            {localityRows.map((row) => {
                              const selected = address.locality === row.label;
                              return (
                                <li key={row.id}>
                                  <button
                                    type="button"
                                    className={`w-full px-5 py-2.5 text-left text-sm transition-colors ${
                                      selected
                                        ? 'bg-swisse-gold/15 font-semibold text-swisse-ink dark:text-foreground'
                                        : 'text-swisse-ink hover:bg-swisse-mist/80 dark:text-foreground dark:hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      setAddress((prev) => ({
                                        ...prev,
                                        locality: row.label,
                                      }));
                                      setLocPickerOpen(false);
                                    }}
                                  >
                                    <span className="line-clamp-2">{row.label}</span>
                                    {row.postalCode ? (
                                      <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-swisse-ink/50 dark:text-muted-foreground">
                                        {row.postalCode}
                                      </span>
                                    ) : null}
                                  </button>
                                </li>
                              );
                            })}
                            {localityRows.length === 0 && (
                              <li className="border-t border-swisse-ink/10 px-4 py-3 dark:border-border">
                                <p className="text-xs text-swisse-ink/60 dark:text-muted-foreground mb-2">
                                  {isFrench
                                    ? 'Aucune localité indexée pour cette délégation. Saisissez la vôtre :'
                                    : 'No indexed localities for this delegation. Type yours:'}
                                </p>
                                <input
                                  type="text"
                                  className="w-full py-2.5 px-3 text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/15 dark:border-border focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                                  placeholder={
                                    isFrench ? 'Quartier, cité, immeuble…' : 'Neighbourhood, block, building…'
                                  }
                                  value={address.locality}
                                  onChange={(e) => setAddress({ ...address, locality: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1">
                        {isFrench ? 'Pays' : 'Country'}
                      </label>
                      <div className="py-4 px-6 text-sm bg-swisse-mist/40 dark:bg-muted/40 border border-swisse-ink/10 dark:border-border text-swisse-ink dark:text-foreground">
                        {isFrench ? 'Tunisie' : CHECKOUT_COUNTRY}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section data-reveal className="reveal">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-swisse-gold font-serif text-xl italic">02</span>
                    <h2 className="font-serif text-2xl md:text-3xl uppercase tracking-[0.12em]">{isFrench ? 'Paiement' : 'Payment'}</h2>
                  </div>

                  <div className="flex gap-8 border-b border-swisse-ink/10 dark:border-border mb-8">
                    <button
                      type="button"
                      className="pb-4 text-[10px] uppercase tracking-[0.22em] font-bold border-b-2 border-swisse-gold text-swisse-ink dark:text-foreground"
                    >
                      {isFrench ? 'Paiement à la livraison' : 'Cash on Delivery'}
                    </button>
                    <button
                      type="button"
                      disabled
                      className="pb-4 text-[10px] uppercase tracking-[0.22em] font-bold border-b-2 border-transparent text-swisse-ink/35 dark:text-muted-foreground cursor-not-allowed"
                      title={isFrench ? 'Bientôt disponible' : 'Coming soon'}
                    >
                      {isFrench ? 'Carte' : 'Card'}
                    </button>
                    <button
                      type="button"
                      disabled
                      className="pb-4 text-[10px] uppercase tracking-[0.22em] font-bold border-b-2 border-transparent text-swisse-ink/35 dark:text-muted-foreground cursor-not-allowed"
                      title={isFrench ? 'Bientôt disponible' : 'Coming soon'}
                    >
                      {isFrench ? 'Virement' : 'Bank Transfer'}
                    </button>
                  </div>

                  <div className="bg-white/50 dark:bg-card/60 border border-swisse-gold/15 dark:border-border p-6">
                    <p className="text-sm text-swisse-ink/80 dark:text-muted-foreground leading-relaxed">
                      {isFrench
                        ? 'Payez à la réception de votre commande. Votre commande sera confirmée et suivie via le tableau de bord administrateur.'
                        : 'Pay when your order arrives. Your order will be confirmed and tracked by the admin dashboard.'}
                    </p>
                    {qualifiesForFreeShipping && (
                      <p className="mt-4 text-xs text-swisse-ink/60 dark:text-muted-foreground">
                        {isFrench
                          ? `Livraison gratuite appliquée pour les commandes supérieures à ${FREE_SHIPPING_THRESHOLD_TND} TND.`
                          : `Free shipping applied for orders over ${FREE_SHIPPING_THRESHOLD_TND} TND.`}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-2">
                        <label htmlFor="checkout-alt-phone" className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1">
                          {isFrench ? 'Téléphone secondaire (optionnel)' : 'Alternate Phone (optional)'}
                        </label>
                        <input
                          id="checkout-alt-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="28700123"
                          className="w-full py-4 px-6 text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                          value={billing.phoneAlt}
                          onChange={(e) => setBilling({ ...billing, phoneAlt: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="checkout-notes" className="text-[10px] uppercase tracking-[0.22em] text-swisse-ink/60 dark:text-muted-foreground font-bold ml-1">
                          {isFrench ? 'Notes de livraison (optionnel)' : 'Delivery Notes (optional)'}
                        </label>
                        <input
                          id="checkout-notes"
                          type="text"
                          placeholder={isFrench ? 'Code, étage, instructions…' : 'Gate code, floor, instructions'}
                          className="w-full py-4 px-6 text-sm bg-[#faf8f5] dark:bg-card border border-swisse-ink/10 dark:border-border focus:border-swisse-gold focus:ring-1 focus:ring-swisse-gold outline-none"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Summary column */}
              <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
                <div className="bg-white dark:bg-card p-8 md:p-10 border border-swisse-gold/15 dark:border-border shadow-sm">
                  <h3 className="font-serif text-lg md:text-xl uppercase tracking-[0.22em] mb-8 pb-6 border-b border-swisse-ink/10 dark:border-border">
                    {isFrench ? 'Récapitulatif' : 'Order Summary'}
                  </h3>

                  <div className="space-y-7 mb-8 max-h-[420px] overflow-y-auto pr-2 swisse-scrollbar">
                    {displayItems.map((it) => (
                      <div key={it.key} className="flex gap-5">
                        <div className="w-20 md:w-24 aspect-[3/4] overflow-hidden bg-swisse-canvas dark:bg-muted border border-swisse-gold/10 dark:border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.image || 'https://images.unsplash.com/photo-1520975869019-45f4b5d132f8?q=80&w=1200&auto=format&fit=crop'}
                            alt={it.name}
                            className="w-full h-full object-cover mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="text-xs uppercase tracking-wider font-bold mb-1">{it.name}</h4>
                            <p className="text-[10px] text-swisse-ink/50 dark:text-muted-foreground">
                              {it.size ? (isFrench ? `Taille : ${it.size}` : `Size: ${it.size}`) : '—'}
                            </p>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] text-swisse-ink/60 dark:text-muted-foreground">
                              {isFrench ? 'Qté : ' : 'QTY: '}
                              {String(it.qty).padStart(2, '0')}
                            </span>
                            <span className="text-sm font-bold">{formatPrice(it.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-8 border-t border-swisse-ink/10 dark:border-border">
                    <div className="flex justify-between text-xs text-swisse-ink/60 dark:text-muted-foreground uppercase tracking-[0.22em]">
                      <span>{isFrench ? 'Sous-total' : 'Subtotal'}</span>
                      <span className="font-bold">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-swisse-ink/60 dark:text-muted-foreground uppercase tracking-[0.22em]">
                      <span>{isFrench ? 'Livraison' : 'Shipping'}</span>
                      <span className="font-bold">
                        {deliveryCost === 0 ? (isFrench ? 'GRATUIT' : 'FREE') : formatPrice(deliveryCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-swisse-ink/60 dark:text-muted-foreground uppercase tracking-[0.22em]">
                      <span>{isFrench ? 'Taxes estimées' : 'Estimated Taxes'}</span>
                      <span className="font-bold">{formatPrice(0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-serif font-bold pt-6 border-t border-swisse-gold/20">
                      <span>Total</span>
                      <span className="text-swisse-gold">{formatPrice(subtotal + deliveryCost)}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-6 border border-red-500/20 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-200 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    id="place-order-btn"
                    disabled={placing}
                    onClick={placeOrder}
                    className="mt-8 block w-full text-center py-5 bg-swisse-gold text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-swisse-ink dark:hover:bg-primary transition-colors disabled:opacity-60"
                  >
                    {placing ? (isFrench ? 'Finalisation…' : 'Completing…') : (isFrench ? 'Valider la commande' : 'Complete Purchase')}
                  </button>

                  <p className="text-xs text-swisse-ink/50 dark:text-muted-foreground mt-4 leading-relaxed">
                    {token
                      ? (isFrench
                          ? 'L’administrateur gérera et suivra cette commande dans le tableau de bord.'
                          : 'Admin will manage and track this order in the dashboard.')
                      : (isFrench
                          ? 'Commande invitée — l’administrateur gérera et suivra cette commande dans le tableau de bord.'
                          : 'Guest checkout — admin will manage and track this order in the dashboard.')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white dark:bg-card border border-swisse-gold/20 dark:border-border flex flex-col items-center text-center gap-3">
                    <span className="w-10 h-10 rounded-full border border-swisse-gold/30 flex items-center justify-center text-swisse-gold font-serif">
                      ✓
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.22em] font-bold text-swisse-ink/70 dark:text-muted-foreground">
                      {isFrench ? 'Commande sécurisée' : 'Secure Order'}
                    </span>
                  </div>
                  <div className="p-6 bg-white dark:bg-card border border-swisse-gold/20 dark:border-border flex flex-col items-center text-center gap-3">
                    <span className="w-10 h-10 rounded-full border border-swisse-gold/30 flex items-center justify-center text-swisse-gold font-serif">
                      ⟲
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.22em] font-bold text-swisse-ink/70 dark:text-muted-foreground">
                      {isFrench ? 'Garantie suisse' : 'Swiss Guarantee'}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}


