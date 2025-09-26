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
  
  console.log('getImageUrl input:', imagePath);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  
  // Check if we're in production by looking at the API URL
  // If API URL contains 'onrender.com' or 'vercel.app', we're in production
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const isProduction = API_BASE_URL.includes('onrender.com') || API_BASE_URL.includes('vercel.app') || process.env.NODE_ENV === 'production';
  
  console.log('isProduction:', isProduction);
  
  if (isProduction) {
    // Use relative URLs for production - Next.js rewrites will handle them
    if (imagePath.startsWith('/uploads/')) {
      console.log('getImageUrl output (production):', imagePath);
      return imagePath;
    }
    
    const relativeUrl = `/uploads/${imagePath}`;
    console.log('getImageUrl output (production):', relativeUrl);
    return relativeUrl;
  } else {
    // Use full URLs for development
    const BACKEND_URL = API_BASE_URL.replace('/api', ''); // Remove /api to get base backend URL
    
    if (imagePath.startsWith('/uploads/')) {
      const fullUrl = `${BACKEND_URL}${imagePath}`;
      console.log('getImageUrl output (development):', fullUrl);
      return fullUrl;
    }
    
    const fullUrl = `${BACKEND_URL}/uploads/${imagePath}`;
    console.log('getImageUrl output (development):', fullUrl);
    return fullUrl;
  }
}

