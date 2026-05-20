import useSWR from 'swr';
import { productListConfig } from '@/lib/swr/config';

export interface UseCategoryProductsParams {
  slug: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

type CategoryProductsData = {
  category?: { id: number; name: string; slug: string; description?: string };
  products?: unknown[];
  pagination?: {
    currentPage?: number;
    totalPages?: number;
    totalProducts?: number;
    perPage?: number;
  };
};

function categoryProductsKey(params: UseCategoryProductsParams): string {
  const qs = new URLSearchParams();
  if (params.sort) qs.append('sort', params.sort);
  if (params.order) qs.append('order', params.order);
  if (params.page) qs.append('page', String(params.page));
  if (params.limit) qs.append('limit', String(params.limit));
  const query = qs.toString();
  return query
    ? `/categories/${params.slug}/products?${query}`
    : `/categories/${params.slug}/products`;
}

export function useCategoryProducts(params: UseCategoryProductsParams | null) {
  const key = params?.slug ? categoryProductsKey(params) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data?: CategoryProductsData }>(
    key,
    productListConfig
  );

  return {
    category: data?.data?.category ?? null,
    products: data?.data?.products ?? [],
    pagination: data?.data?.pagination,
    loading: isLoading,
    isValidating,
    error: error as Error | undefined,
    mutate,
  };
}
