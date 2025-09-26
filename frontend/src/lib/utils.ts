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
  
  console.log('getImageUrl v2.0 input:', imagePath);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('window.location.hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
  
  // Determine if we're in production
  const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  
  console.log('isProduction (client-side):', isProduction);
  
  // Use hardcoded production backend URL if in production
  if (isProduction) {
    const PRODUCTION_BACKEND_URL = 'https://weary-backend.onrender.com';
    console.log('Using production backend URL:', PRODUCTION_BACKEND_URL);
    
    if (imagePath.startsWith('/uploads/')) {
      const fullUrl = `${PRODUCTION_BACKEND_URL}${imagePath}`;
      console.log('getImageUrl v2.0 output (production):', fullUrl);
      return fullUrl;
    }
    
    const fullUrl = `${PRODUCTION_BACKEND_URL}/uploads/${imagePath}`;
    console.log('getImageUrl v2.0 output (production):', fullUrl);
    return fullUrl;
  }
  
  // Development fallback
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const BACKEND_URL = API_BASE_URL.replace('/api', '');
  
  console.log('Backend URL (development):', BACKEND_URL);
  
  if (imagePath.startsWith('/uploads/')) {
    const fullUrl = `${BACKEND_URL}${imagePath}`;
    console.log('getImageUrl v2.0 output (development):', fullUrl);
    return fullUrl;
  }
  
  const fullUrl = `${BACKEND_URL}/uploads/${imagePath}`;
  console.log('getImageUrl v2.0 output (development):', fullUrl);
  return fullUrl;
}

