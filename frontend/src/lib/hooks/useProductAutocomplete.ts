import useSWR from 'swr';
import { productAutocompleteConfig } from '@/lib/swr/config';

export interface AutocompleteProduct {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  price: number;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

export interface AutocompleteCategory {
  id: number;
  name: string;
  slug: string;
}

export interface AutocompleteResults {
  products: AutocompleteProduct[];
  categories: AutocompleteCategory[];
  popularProducts: AutocompleteProduct[];
}

export function useProductAutocomplete(query: string) {
  const trimmed = query.trim();
  const key =
    trimmed.length >= 2 ? `/products/autocomplete?q=${encodeURIComponent(trimmed)}` : null;

  const { data, error, isLoading, isValidating } = useSWR<{ data?: AutocompleteResults }>(
    key,
    productAutocompleteConfig
  );

  return {
    results: data?.data ?? null,
    loading: isLoading,
    isValidating,
    error: error as Error | undefined,
  };
}
