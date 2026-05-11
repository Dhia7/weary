'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getCartItemKey, useCart } from '@/lib/contexts/CartContext';
import { getImageUrl } from '@/lib/utils';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPrice = (price: number | string) => `${Number(price).toFixed(2)} TND`;

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { isFrench } = useLanguage();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent | TouchEvent) => {
      const panel = panelRef.current;
      if (!panel) return;

      const target = e.target as Node | null;
      if (!target) return;

      // Close when clicking/tapping outside the panel content
      if (!panel.contains(target)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handler, true);
    document.addEventListener('touchstart', handler, true);
    return () => {
      document.removeEventListener('mousedown', handler, true);
      document.removeEventListener('touchstart', handler, true);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleCheckout = () => {
    handleClose();
    router.push('/checkout');
  };

  const hasItems = items.length > 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-200 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClose}
        />
      )}

      {/* Cart Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:max-w-md lg:max-w-lg h-[100dvh] bg-card text-card-foreground shadow-2xl z-[70] transform transition-transform duration-200 ease-in-out ${
          isOpen && isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        ref={panelRef}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <h2 className="text-lg font-display font-semibold text-foreground">
              {isFrench ? 'Panier' : 'Shopping Cart'} ({items.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              title={isFrench ? 'Fermer le panier' : 'Close cart panel'}
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
                          alt={item.name}
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
                        <span className="line-clamp-2">{item.name}</span>
                      </Link>
                      {item.size && (
                        <p className="text-xs font-medium text-primary mt-0.5">
                          {isFrench ? 'Taille' : 'Size'}: {item.size}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(item.price)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateQuantity(getCartItemKey(item), Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center border border-border rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="w-8 h-8 flex items-center justify-center border border-border rounded-md text-sm hover:bg-muted"
                          title={isFrench ? 'Augmenter la quantite' : 'Increase quantity'}
                          aria-label={isFrench ? 'Augmenter la quantite' : 'Increase quantity'}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeItem(getCartItemKey(item))}
                        className="mt-2 inline-flex items-center justify-center p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-colors"
                        title={isFrench ? 'Supprimer l article' : 'Remove item'}
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
    </>
  );
}
