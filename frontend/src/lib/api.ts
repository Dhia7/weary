// Centralized API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number | boolean>) => {
  const url = new URL(endpoint, API_BASE_URL);
  
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
