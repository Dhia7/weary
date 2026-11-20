import { useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import { productListConfig } from '@/lib/swr/config';
import { productsListKey, type ApiResponse } from '@/lib/swr/fetcher';

type ProductsPageData = {
  products: unknown[];
  pagination?: {
    currentPage?: number;
    totalPages?: number;
    totalProducts?: number;
    perPage?: number;
  };
};

type ProductsPage = ApiResponse<ProductsPageData>;

export interface UseInfiniteProductsParams {
  limit?: number;
  active?: boolean;
  sort?: string;
  order?: string;
}

export function useInfiniteProducts(params?: UseInfiniteProductsParams) {
  const limit = params?.limit ?? 12;
  const sort = params?.sort;
  const order = params?.order;
  const active = params?.active;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: ProductsPage | null) => {
      if (previousPageData && !previousPageData.data?.products?.length) return null;
      const totalPages = previousPageData?.data?.pagination?.totalPages;
      if (typeof totalPages === 'number' && pageIndex >= totalPages) return null;

      return productsListKey({
        sort,
        order,
        page: pageIndex + 1,
        limit,
        active,
      });
    },
    [sort, order, limit, active]
  );

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<ProductsPage>(
    getKey,
    {
      ...productListConfig,
      revalidateFirstPage: false,
    }
  );

  const products = data?.flatMap((page) => page.data?.products ?? []) ?? [];
  const totalPages = data?.[0]?.data?.pagination?.totalPages ?? 1;
  const totalProducts = data?.[0]?.data?.pagination?.totalProducts ?? 0;
  const lastPageCount = data?.[data.length - 1]?.data?.products?.length ?? 0;
  const hasMore = Boolean(data && data.length > 0 && data.length < totalPages && lastPageCount > 0);
  const isLoadingMore = size > (data?.length ?? 0) && (isValidating || isLoading);

  return {
    products,
    totalProducts,
    hasMore,
    isLoadingMore,
    loading: isLoading,
    error,
    setSize,
    mutate,
  };
}
