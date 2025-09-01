'use client';

import React from 'react';
import { useAuth } from './contexts/AuthContext';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function useAuthorizedFetch() {
  const { token } = useAuth();

  const authorizedFetch = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    return response;
  };

  return authorizedFetch;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || !user.isAdmin) {
    // Simple guard: in a full app, redirect to login or 404
    return <div className="p-6">Not authorized</div>;
  }
  return <>{children}</>;
}


