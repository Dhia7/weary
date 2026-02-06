import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UseCollectionsParams {
  limit?: number;
  active?: boolean;
  page?: number;
}

export function useCollections(params?: UseCollectionsParams) {
  const queryString = new URLSearchParams();
  if (params?.limit) queryString.append('limit', params.limit.toString());
  if (params?.active !== undefined) queryString.append('active', params.active.toString());
  if (params?.page) queryString.append('page', params.page.toString());
  
  const { data, error, isLoading } = useSWR(
    `/api/collections?${queryString.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
      revalidateIfStale: true,
    }
  );
  
  return {
    collections: data?.data?.collections || [],
    pagination: data?.data?.pagination,
    loading: isLoading,
    error
  };
}
