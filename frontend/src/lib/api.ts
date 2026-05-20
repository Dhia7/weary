// Centralized API configuration
// In the browser, use same-origin /api (Next.js rewrites proxy to the backend).
// On the server, use the absolute backend URL from env.
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
}

/** @deprecated Prefer getApiBaseUrl() in client code — this may resolve to localhost on SSR. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number | boolean>) => {
  const apiBaseUrl = getApiBaseUrl();
  // Ensure the final URL always targets the backend's /api namespace
  const isRelativeBase = apiBaseUrl.startsWith('/');
  const originForRelative = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const base = isRelativeBase ? new URL(apiBaseUrl, originForRelative) : new URL(apiBaseUrl);
  // Always resolve against <origin>/api/ to avoid path replacement issues
  const apiBase = new URL('/api/', base.origin);

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(normalizedEndpoint, apiBase);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  LOGOUT: '/auth/logout',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_SLUG: (slug: string) => `/products/${slug}`,
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_PRODUCTS: (slug: string) => `/categories/${slug}/products`,
  
  // Collections
  COLLECTIONS: '/collections',
  COLLECTION_BY_SLUG: (slug: string) => `/collections/${slug}`,
  
  // Cart
  CART: '/cart',
  CART_ADD: '/cart/add',
  CART_UPDATE: '/cart/update',
  CART_REMOVE: '/cart/remove',
  CART_CLEAR: '/cart/clear',
  
  // Wishlist
  WISHLIST: '/wishlist',
  WISHLIST_ADD: '/wishlist/add',
  WISHLIST_REMOVE: '/wishlist/remove',
  
  // Orders
  ORDERS: '/orders',
  ORDER_CREATE: '/orders',
  
  // Health
  HEALTH: '/health',
} as const;
