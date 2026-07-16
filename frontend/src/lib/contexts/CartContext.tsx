'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { buildApiUrl } from '@/lib/api';

export interface CartItem {
  id: string; // Unique cart item identifier (cartItemId or productId-size)
  productId?: string; // Product ID for backend operations
  name: string;
  nameFr?: string | null;
  price: number;
  image?: string;
  slug?: string;
  quantity: number;
  size?: string;
  color?: string;
  colorFr?: string | null;
  variantId?: string;
  cartItemId?: number; // Original cart item ID from database
  allowCustomerQuantity?: boolean;
  maxStock?: number;
}

export const getCartItemKey = (item: Pick<CartItem, 'id' | 'productId' | 'size' | 'color' | 'variantId' | 'cartItemId'>): string => {
  if (item.cartItemId) {
    return `cart-${item.cartItemId}`;
  }
  if (item.variantId) {
    return `${item.productId || item.id}-v${item.variantId}`;
  }

  return `${item.productId || item.id}-${item.color || 'no-color'}-${item.size || 'no-size'}`;
};

interface CartContextType {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  buyNow: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'guest_cart_items_v1';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Helper function to deduplicate cart items by creating a unique key
const deduplicateCartItems = (items: CartItem[]): CartItem[] => {
  const seen = new Map<string, CartItem>();
  
  for (const item of items) {
    const uniqueKey = getCartItemKey(item);
    
    // If we haven't seen this key, add it
    // If we have seen it, keep the one with the higher quantity (or first one)
    if (!seen.has(uniqueKey)) {
      seen.set(uniqueKey, item);
    } else {
      // If duplicate found, merge quantities or keep the one with higher quantity
      const existing = seen.get(uniqueKey)!;
      if (item.quantity > existing.quantity) {
        seen.set(uniqueKey, item);
      }
    }
  }
  
  return Array.from(seen.values());
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user-specific storage key
  // removed unused getStorageKey helper

  // Load cart from localStorage (for guest users) or fetch from backend (for authenticated users)
  const loadCart = async () => {
    if (user && token) {
      // Load from backend for authenticated users
      try {
        setIsLoading(true);
        const response = await fetch(buildApiUrl('/cart'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const items = data.data.items || [];
          setItems(deduplicateCartItems(items));
        } else {
          console.warn('Backend cart not available, using local storage');
          // Fall back to localStorage if backend is not available
          try {
            const localKey = `user_cart_${user.id}_v1`;
            const localData = localStorage.getItem(localKey);
            if (localData) {
              const parsedItems = JSON.parse(localData);
              setItems(deduplicateCartItems(parsedItems));
            } else {
              setItems([]);
            }
          } catch (e) {
            setItems([]);
          }
        }
      } catch (err) {
        console.warn('Backend not available, using local storage:', err instanceof Error ? err.message : String(err));
        // Fall back to localStorage if backend is not available
        try {
          const localKey = `user_cart_${user.id}_v1`;
          const localData = localStorage.getItem(localKey);
          if (localData) {
            const parsedItems = JSON.parse(localData);
            setItems(deduplicateCartItems(parsedItems));
          } else {
            setItems([]);
          }
        } catch (e) {
          setItems([]);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Load from localStorage for guest users
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(GUEST_STORAGE_KEY) : null;
        if (raw) {
          const parsed: CartItem[] = JSON.parse(raw);
          setItems(deduplicateCartItems(parsed));
        } else {
          setItems([]);
        }
      } catch (e) {
        console.warn('Failed to parse guest cart from storage');
        setItems([]);
      }
    }
  };

  // Save cart to localStorage (for guest users) or backend (for authenticated users)
  const saveCart = async (cartItems: CartItem[]) => {
    if (user && token) {
      // For authenticated users, also save to localStorage as backup
      try {
        if (typeof window !== 'undefined') {
          const localKey = `user_cart_${user.id}_v1`;
          localStorage.setItem(localKey, JSON.stringify(cartItems));
        }
      } catch (e) {
        console.warn('Failed to save user cart to local storage');
      }
    } else {
      // Save to localStorage for guest users
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(cartItems));
        }
      } catch (e) {
        console.warn('Failed to save guest cart to storage');
      }
    }
  };

  // Load cart when user changes or component mounts
  useEffect(() => {
    loadCart();
  }, [user, token]);

  // Save cart to localStorage for guest users when items change
  useEffect(() => {
    if (!user) {
      saveCart(items);
    }
  }, [items, user]);

  // Sync guest cart with user cart when user logs in
  const syncCart = async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      
      // Get guest cart items from localStorage
      const guestCartRaw = typeof window !== 'undefined' ? localStorage.getItem(GUEST_STORAGE_KEY) : null;
      const guestCartItems = guestCartRaw ? JSON.parse(guestCartRaw) : [];

      if (guestCartItems.length > 0) {
        // Sync guest cart with user cart
        const response = await fetch(buildApiUrl('/cart/sync'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ guestCartItems }),
        });

        if (response.ok) {
          const data = await response.json();
          const items = data.data.items || [];
          setItems(deduplicateCartItems(items));
          
          // Clear guest cart after successful sync
          if (typeof window !== 'undefined') {
            localStorage.removeItem(GUEST_STORAGE_KEY);
          }
        } else {
          console.error('Failed to sync cart');
        }
      } else {
        // No guest cart to sync, just load user cart
        await loadCart();
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync cart when user logs in
  useEffect(() => {
    if (user && token) {
      syncCart();
    }
  }, [user, token]);

  const addItem = async (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const allowQty = Boolean(item.allowCustomerQuantity);
    const maxStock = item.maxStock ?? 0;
    if (maxStock <= 0) {
      console.warn('Cannot add item with no available stock');
      return;
    }
    const addQty = allowQty
      ? Math.max(1, Math.min(quantity, maxStock > 0 ? maxStock : quantity))
      : 1;
    if (user && token) {
      // Add to backend for authenticated users
      try {
        setIsLoading(true);
        const response = await fetch(buildApiUrl('/cart'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: item.productId || item.id,
            quantity: addQty,
            size: item.size,
            color: item.color,
            variantId: item.variantId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const items = data.data.items || [];
          setItems(deduplicateCartItems(items));
        } else {
          const errorData = await response.json();
          console.error('Failed to add item to cart:', errorData.message);
        }
      } catch (error) {
        console.error('Error adding item to cart:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Add to local state for guest users
      // Match by product ID AND size (if size exists)
      setItems(prev => {
        const existing = prev.find(
          (p) => getCartItemKey(p) === getCartItemKey(item)
        );
        if (existing) {
          if (!allowQty) return prev;
          const nextQty =
            maxStock > 0
              ? Math.min(existing.quantity + addQty, maxStock)
              : existing.quantity + addQty;
          return prev.map((p) =>
            getCartItemKey(p) === getCartItemKey(item)
              ? { ...p, quantity: nextQty }
              : p
          );
        }
        return [...prev, { ...item, quantity: addQty }];
      });
    }
  };

  const removeItem = async (id: string) => {
    const item = items.find(i => getCartItemKey(i) === id || i.id === id);
    if (!item) {
      console.error('Item not found in cart');
      return;
    }

    if (user && token) {
      // Remove from backend for authenticated users
      try {
        setIsLoading(true);
        // Use productId if available, otherwise parse from id
        const productId = item.productId || item.id.split('-')[0];
        const params = new URLSearchParams();
        if (item?.size) params.set('size', item.size);
        if (item?.color) params.set('color', item.color);
        if (item?.variantId) params.set('variantId', item.variantId);
        const qs = params.toString();
        const response = await fetch(buildApiUrl(`/cart/${productId}${qs ? `?${qs}` : ''}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const items = data.data.items || [];
          setItems(deduplicateCartItems(items));
        } else {
          console.error('Failed to remove item from cart');
        }
      } catch (error) {
        console.error('Error removing item from cart:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Remove from local state for guest users
      setItems(prev => prev.filter(p => getCartItemKey(p) !== id && p.id !== id));
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    const item = items.find(i => getCartItemKey(i) === id || i.id === id);
    if (!item) {
      console.error('Item not found in cart');
      return;
    }
    if (!item.allowCustomerQuantity) return;

    const maxStock = item.maxStock ?? 0;
    const nextQty =
      maxStock > 0
        ? Math.max(1, Math.min(quantity, maxStock))
        : Math.max(1, quantity);

    if (user && token) {
      // Update in backend for authenticated users
      try {
        setIsLoading(true);
        // Use productId if available, otherwise parse from id
        const productId = item.productId || item.id.split('-')[0];
        const response = await fetch(buildApiUrl('/cart'), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            quantity: nextQty,
            size: item?.size,
            color: item?.color,
            variantId: item?.variantId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const items = data.data.items || [];
          setItems(deduplicateCartItems(items));
        } else {
          const errorData = await response.json();
          console.error('Failed to update cart item:', errorData.message);
        }
      } catch (error) {
        console.error('Error updating cart item:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Update in local state for guest users
      setItems(prev => prev
        .map(p => ((getCartItemKey(p) === id || p.id === id) ? { ...p, quantity: nextQty } : p))
        .filter(p => p.quantity > 0)
      );
    }
  };

  const clearCart = async () => {
    if (user && token) {
      // Clear from backend for authenticated users
      try {
        setIsLoading(true);
        const response = await fetch(buildApiUrl('/cart'), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setItems([]);
        } else {
          console.error('Failed to clear cart');
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Clear local state for guest users
      setItems([]);
    }
  };

  const buyNow = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const maxStock = item.maxStock ?? 0;
    if (maxStock <= 0) {
      console.warn('Cannot buy item with no available stock');
      return;
    }
    const allowQty = Boolean(item.allowCustomerQuantity);
    const qty = allowQty
      ? Math.max(1, Math.min(quantity, maxStock > 0 ? maxStock : quantity))
      : 1;
    setItems([{ ...item, quantity: qty }]);
  };

  const totalQuantity = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.price * it.quantity, 0), [items]);

  const value: CartContextType = {
    items,
    totalQuantity,
    subtotal,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    buyNow,
    syncCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
