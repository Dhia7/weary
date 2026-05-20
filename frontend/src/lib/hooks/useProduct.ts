import useSWR from 'swr';
import { productDetailConfig } from '@/lib/swr/config';
import type { Product } from '@/lib/types/product';

export function useProduct(slug: string | undefined) {
  const key = slug ? `/products/${slug}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data?: { product?: Product } }>(
    key,
    productDetailConfig
  );

  return {
    product: data?.data?.product ?? null,
    loading: isLoading,
    isValidating,
    error: error as Error | undefined,
    mutate,
  };
}
