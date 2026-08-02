import useSWR from 'swr';
import { productListConfig } from '@/lib/swr/config';
import { productsListKey } from '@/lib/swr/fetcher';

export interface UseProductsParams {
  limit?: number;
  active?: boolean;
  page?: number;
  categoryId?: number;
  q?: string;
  sort?: string;
  order?: string;
  homepageCollage?: boolean;
}

type ProductsListData = {
  products: unknown[];
  pagination?: {
    currentPage?: number;
    totalPages?: number;
    totalProducts?: number;
    perPage?: number;
  };
};

export function useProducts(params?: UseProductsParams) {
  const key = productsListKey({
    limit: params?.limit,
    active: params?.active,
    page: params?.page,
    categoryId: params?.categoryId,
    q: params?.q,
    sort: params?.sort,
    order: params?.order,
    homepageCollage: params?.homepageCollage,
  });

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
