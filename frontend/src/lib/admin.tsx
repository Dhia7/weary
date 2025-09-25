'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useAuthorizedFetch() {
  const { token } = useAuth();

  const authorizedFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Only set Content-Type to application/json if body is not FormData
    // FormData should let the browser set the correct multipart/form-data content type
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (token) headers.set('Authorization', `Bearer ${token}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      // Re-throw the error so it can be handled by the calling code
      throw error;
    }
  }, [token]);

  return authorizedFetch;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading) return null;
  if (!user || !user.isAdmin) return null;
  return <>{children}</>;
}


