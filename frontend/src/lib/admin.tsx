'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export function useAuthorizedFetch() {
  const authorizedFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});

    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      return await apiFetch(path, { ...options, headers });
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }, []);

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
