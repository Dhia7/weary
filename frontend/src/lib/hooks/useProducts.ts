import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UseProductsParams {
  limit?: number;
  active?: boolean;
  page?: number;
  categoryId?: number;
  q?: string;
  sort?: string;
  order?: string;
}

export function useProducts(params?: UseProductsParams) {
  const queryString = new URLSearchParams();
  if (params?.limit) queryString.append('limit', params.limit.toString());
  if (params?.active !== undefined) queryString.append('active', params.active.toString());
  if (params?.page) queryString.append('page', params.page.toString());
  if (params?.categoryId) queryString.append('categoryId', params.categoryId.toString());
  if (params?.q) queryString.append('q', params.q);
  if (params?.sort) queryString.append('sort', params.sort);
  if (params?.order) queryString.append('order', params.order);
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products?${queryString.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
      revalidateIfStale: true,
    }
  );
  
  return {
    products: data?.data?.products || [],
    pagination: data?.data?.pagination,
    loading: isLoading,
    error,
    mutate
  };
}
