import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  // Absolute URL passed-through
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  // Force site-relative path to use Next.js rewrites (bypasses Vercel image optimizer)
  // This ensures images load via /uploads/... not /api/uploads/...
  const normalized = imagePath.replace(/^\/+/, '');
  const result = imagePath.startsWith('/uploads/')
    ? imagePath
    : `/uploads/${normalized}`;
  
  console.log('getImageUrl v2 FIXED:', { input: imagePath, output: result });
  return result;
}

// Admin order seen tracking utilities
const SEEN_ORDERS_KEY = 'admin_seen_orders';

export function getSeenOrderIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(SEEN_ORDERS_KEY);
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (error) {
    console.error('Error reading seen orders from localStorage:', error);
  }
  return new Set();
}

export function markOrderAsSeen(orderId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const seenIds = getSeenOrderIds();
    seenIds.add(orderId);
    localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify(Array.from(seenIds)));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('orderSeen', { detail: { orderId } }));
  } catch (error) {
    console.error('Error marking order as seen:', error);
  }
}

export function isOrderSeen(orderId: string): boolean {
  const seenIds = getSeenOrderIds();
  return seenIds.has(orderId);
}

export function clearSeenOrders(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SEEN_ORDERS_KEY);
    window.dispatchEvent(new CustomEvent('ordersCleared'));
  } catch (error) {
    console.error('Error clearing seen orders:', error);
  }
}