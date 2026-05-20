import useSWR from 'swr';
import { productListConfig } from '@/lib/swr/config';
import { productsListKey } from '@/lib/swr/fetcher';
import type { UseProductsParams } from '@/lib/hooks/useProducts';

type ProductsListData = {
  products: unknown[];
  pagination?: {
    currentPage?: number;
    totalPages?: number;
    totalProducts?: number;
    perPage?: number;
  };
};

/** Search page — list endpoint; no fetch until `q` is non-empty */
export function useProductSearch(params: UseProductsParams & { q: string }) {
  const key = params.q.trim()
    ? productsListKey({
        q: params.q,
        limit: params.limit,
        active: params.active ?? true,
        page: params.page,
        categoryId: params.categoryId,
        sort: params.sort,
        order: params.order,
      })
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data?: ProductsListData }>(
    key,
    productListConfig
  );

  return {
    products: data?.data?.products ?? [],
    pagination: data?.data?.pagination,
    loading: isLoading,
    isValidating,
    error,
    mutate,
  };
}
