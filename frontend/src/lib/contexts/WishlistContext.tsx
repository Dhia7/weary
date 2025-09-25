'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WishlistItem {
  id: string;
  userId: number;
  productId: string;
  addedAt: string;
  Product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    imageUrl?: string;
    images?: string[];
    mainThumbnailIndex?: number;
    isActive: boolean;
    quantity: number;
  };
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const isAuthenticated = !!(user && token);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Fetch wishlist items
  const fetchWishlist = async () => {
    if (!isAuthenticated || !user || !token) {
      setWishlistItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch wishlist (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        // Normalize productId to string for consistent comparisons
        const normalized = Array.isArray(data.data)
          ? data.data.map((item: unknown) => {
              const it = item as Partial<WishlistItem & { productId?: string | number; Product?: { id?: string | number } | null }>;
              const normalizedProduct = it.Product
                ? { ...(it.Product as Record<string, unknown>), id: String(it.Product.id ?? '') }
                : undefined;
              return {
                ...(item as object),
                productId: String(it.productId ?? it.Product?.id ?? ''),
                Product: normalizedProduct as unknown as WishlistItem['Product']
              } as WishlistItem;
            })
          : [];
        setWishlistItems(normalized);
      } else {
        throw new Error(data.message || 'Failed to fetch wishlist');
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      setError('Please log in to add items to your wishlist');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh wishlist to get updated data
        await fetchWishlist();
        return true;
      } else {
        setError(data.message || 'Failed to add item to wishlist');
        return false;
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item to wishlist');
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      setError('Please log in to manage your wishlist');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove item from local state immediately for better UX
        setWishlistItems(prev => prev.filter(item => String(item.productId) !== String(productId)));
        return true;
      } else {
        setError(data.message || 'Failed to remove item from wishlist');
        return false;
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item from wishlist');
      return false;
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => String(item.productId) === String(productId));
  };

  // Clear entire wishlist
  const clearWishlist = async (): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      setError('Please log in to manage your wishlist');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setWishlistItems([]);
        return true;
      } else {
        setError(data.message || 'Failed to clear wishlist');
        return false;
      }
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear wishlist');
      return false;
    }
  };

  // Refresh wishlist
  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  // Load wishlist when user authenticates or switches accounts
  useEffect(() => {
    // Immediately clear previous user's wishlist to avoid UI bleed-through
    setWishlistItems([]);

    if (isAuthenticated && user && token) {
      // Fetch the new user's wishlist
      const timer = setTimeout(() => {
        fetchWishlist();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id, token]);

  const value: WishlistContextType = {
    wishlistItems,
    isLoading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    refreshWishlist,
    wishlistCount: wishlistItems.length
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
