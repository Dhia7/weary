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

  // Normalize incoming path (strip leading slashes for join)
  const normalized = imagePath.replace(/^\/+/, '');

  // Production (SSR or Browser): use backend origin directly
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isProduction =
    process.env.VERCEL === '1' ||
    process.env.NODE_ENV === 'production' ||
    /vercel\.app$/i.test(hostname);

  if (isProduction) {
    const backendOrigin =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      'https://weary-backend.onrender.com';

    return imagePath.startsWith('/uploads/')
      ? `${backendOrigin}${imagePath}`
      : `${backendOrigin}/uploads/${normalized}`;
  }

  // Development: derive backend origin from NEXT_PUBLIC_API_URL or default
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const backendOrigin = apiBaseUrl.replace(/\/?api\/?$/, '');

  return imagePath.startsWith('/uploads/')
    ? `${backendOrigin}${imagePath}`
    : `${backendOrigin}/uploads/${normalized}`;
}

