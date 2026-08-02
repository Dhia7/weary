import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = 'TND') {
  return `${Number(price).toFixed(2)} ${currency}`;
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

/** Convert a data URL to a Blob without fetch (CSP often blocks fetch('data:...')). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    throw new Error('Invalid data URL');
  }
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mime = header.match(/^data:([^;,]+)/i)?.[1] || 'application/octet-stream';
  const isBase64 = /;base64/i.test(header);
  const binary = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
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

// Admin message seen tracking
const SEEN_MESSAGES_KEY = 'admin_seen_messages';

export function getSeenMessageIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(SEEN_MESSAGES_KEY);
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (error) {
    console.error('Error reading seen messages from localStorage:', error);
  }
  return new Set();
}

export function markMessageAsSeen(messageId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const seenIds = getSeenMessageIds();
    seenIds.add(messageId);
    localStorage.setItem(SEEN_MESSAGES_KEY, JSON.stringify(Array.from(seenIds)));
    window.dispatchEvent(new CustomEvent('messageSeen', { detail: { messageId } }));
  } catch (error) {
    console.error('Error marking message as seen:', error);
  }
}

export function isMessageSeen(messageId: string): boolean {
  const seenIds = getSeenMessageIds();
  return seenIds.has(messageId);
}