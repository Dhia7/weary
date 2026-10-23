'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getCartItemKey, useCart } from '@/lib/contexts/CartContext';
import { getImageUrl } from '@/lib/utils';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getProductDisplayName, getColorDisplayName } from '@/lib/i18n/product';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPrice = (price: number | string) => `${Number(price).toFixed(2)} TND`;
const CART_SLIDE_MS = 420;

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { isFrench } = useLanguage();
  const router = useRouter();
  const [isRendered, setIsRendered] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) setIsRendered(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isRendered) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;

    const opening = isOpen;
    const duration = opening ? CART_SLIDE_MS : 320;
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

    const panelAnimation = play(
      panel,
      getComputedStyle(panel).transform,
      opening ? 'translateX(0)' : 'translateX(100%)',
      'transform'
    );
    play(backdrop, getComputedStyle(backdrop).opacity, opening ? '1' : '0', 'opacity');

    let cancelled = false;
    let timer = 0;
    if (!opening) {
      const finish = () => {
        if (!cancelled) setIsRendered(false);
      };
      panelAnimation.finished.then(finish).catch(finish);
      timer = window.setTimeout(finish, duration + 80);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isRendered, isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleCheckout = () => {
    handleClose();
    router.push('/checkout');
  };

  const hasItems = items.length > 0;

  if (!isRendered) return null;

  return createPortal(
    <>
      <div
        ref={backdropRef}
        className="cart-panel-backdrop fixed inset-0 z-[60] bg-black/60"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-panel-title"
        className="cart-panel-slide fixed inset-y-0 right-0 z-[70] flex h-[100dvh] w-full flex-col bg-card text-card-foreground shadow-2xl sm:max-w-md lg:max-w-lg"
        ref={panelRef}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <h2 id="cart-panel-title" className="text-lg font-display font-semibold text-foreground">
              {isFrench ? 'Panier' : 'Shopping Cart'} ({items.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center p-2 hover:bg-muted rounded-full transition-colors"
              aria-label={isFrench ? 'Fermer le panier' : 'Close cart panel'}
            >
              <XMarkIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {!hasItems ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🛍️</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  {isFrench ? 'Votre panier est vide' : 'Your cart is empty'}
                </p>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:brightness-110 transition-colors"
                >
                  {isFrench ? 'Continuer vos achats' : 'Continue Shopping'}
                </button>
              </div>
            ) : (
              <div className="space-y-5 pb-2">
                {items.map((item) => {
                  const uniqueKey = getCartItemKey(item);
                  return (
                  <div
                    key={uniqueKey}
                    className="flex items-start gap-4 p-4 bg-background/90 rounded-xl border border-border/70 shadow-sm"
                  >
                    <Link 
                      href={item.slug ? `/product/${item.slug}` : '#'}
                      className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden hover:opacity-90 transition-opacity shrink-0"
                    >
                      {item.image ? (
                        <Image
                          src={getImageUrl(item.image) || ''}
                          alt={getProductDisplayName(item, isFrench)}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xl">🛍️</span>
                      )}
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={item.slug ? `/product/${item.slug}` : '#'}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer block leading-snug"
                      >
                        <span className="line-clamp-2">{getProductDisplayName(item, isFrench)}</span>
                      </Link>
                      {item.color && (
                        <p className="text-xs font-medium text-primary mt-0.5">
                          {isFrench ? 'Couleur' : 'Color'}:{' '}
                          {getColorDisplayName(
                            { name: item.color, nameFr: item.colorFr },
                            isFrench
                          )}
                        </p>
                      )}
                      {item.size && (
                        <p className="text-xs font-medium text-primary mt-0.5">
                          {isFrench ? 'Taille' : 'Size'}: {item.size}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(item.price)}
                      </p>

                      {item.allowCustomerQuantity && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => updateQuantity(getCartItemKey(item), Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isFrench ? 'Diminuer la quantite' : 'Decrease quantity'}
                            aria-label={isFrench ? 'Diminuer la quantite' : 'Decrease quantity'}
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold w-8 text-center tabular-nums" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(getCartItemKey(item), item.quantity + 1)}
                            disabled={
                              (item.maxStock ?? 0) > 0 && item.quantity >= (item.maxStock ?? 0)
                            }
                            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isFrench ? 'Augmenter la quantite' : 'Increase quantity'}
                            aria-label={isFrench ? 'Augmenter la quantite' : 'Increase quantity'}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(getCartItemKey(item))}
                        className="mt-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-colors"
                        aria-label={
                          isFrench
                            ? `Supprimer ${getProductDisplayName(item, isFrench)} du panier`
                            : `Remove ${getProductDisplayName(item, isFrench)} from cart`
                        }
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {hasItems && (
            <div className="mt-auto border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 p-4 space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">
                  {isFrench ? 'Sous-total' : 'Subtotal'}
                </span>
                <span className="text-base font-semibold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:brightness-110 transition-colors font-medium"
                >
                  {isFrench ? 'Commander' : 'Checkout'}
                </button>
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-red-600 hover:text-red-700 transition-colors text-sm"
                >
                  {isFrench ? 'Vider le panier' : 'Clear Cart'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
