import type { SWRConfiguration } from 'swr';

export const defaultSwrConfig: SWRConfiguration = {
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  errorRetryCount: 2,
};

/** Catalog grids, search, category lists */
export const productListConfig: SWRConfiguration = {
  ...defaultSwrConfig,
  revalidateOnFocus: false,
  dedupingInterval: 30_000,
  keepPreviousData: true,
};

/** Product detail — fresher stock/price on tab return */
export const productDetailConfig: SWRConfiguration = {
  ...defaultSwrConfig,
  revalidateOnFocus: true,
  dedupingInterval: 5_000,
  keepPreviousData: false,
};

/** Autocomplete — short dedupe while typing */
export const productAutocompleteConfig: SWRConfiguration = {
  ...defaultSwrConfig,
  revalidateOnFocus: false,
  dedupingInterval: 3_000,
  keepPreviousData: false,
};
