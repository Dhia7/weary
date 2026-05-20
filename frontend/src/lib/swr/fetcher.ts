import { buildApiUrl } from '@/lib/api';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

/**
 * SWR fetcher for storefront API routes.
 * Accepts either a full URL from buildApiUrl or a path like `/products?...`
 */
export async function jsonFetcher<T = unknown>(key: string): Promise<ApiResponse<T>> {
  const url = key.startsWith('http') || key.startsWith('/api')
    ? key
    : buildApiUrl(key.startsWith('/') ? key.slice(1) : key);

  const res = await fetch(url);
  const data = (await res.json()) as ApiResponse<T>;

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export function productsListKey(params?: Record<string, string | number | boolean | undefined>): string | null {
  if (!params) return '/products';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  });
  const query = qs.toString();
  return query ? `/products?${query}` : '/products';
}
