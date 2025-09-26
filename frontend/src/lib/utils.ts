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
  
  // Get the backend URL from environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const BACKEND_URL = API_BASE_URL.replace('/api', ''); // Remove /api to get base backend URL
  
  // If imagePath already starts with /uploads/, use it directly
  if (imagePath.startsWith('/uploads/')) {
    const fullUrl = `${BACKEND_URL}${imagePath}`;
    console.log('getImageUrl output:', fullUrl);
    return fullUrl;
  }
  
  // If imagePath doesn't start with /uploads/, assume it's a filename and add the path
  const fullUrl = `${BACKEND_URL}/uploads/${imagePath}`;
  console.log('getImageUrl output:', fullUrl);
  return fullUrl;
}

