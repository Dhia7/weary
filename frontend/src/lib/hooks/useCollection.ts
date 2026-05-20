import useSWR from 'swr';
import { productListConfig } from '@/lib/swr/config';

export interface CollectionProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  SKU: string;
  imageUrl?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  size?: string | null;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  products: CollectionProduct[];
}

export function useCollection(slug: string | undefined) {
  const key = slug ? `/collections/${slug}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data?: { collection?: Collection } }>(
    key,
    productListConfig
  );

  return {
    collection: data?.data?.collection ?? null,
    loading: isLoading,
    isValidating,
    error: error as Error | undefined,
    mutate,
  };
}
