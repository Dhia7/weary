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