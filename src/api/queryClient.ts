/**
 * Shared QueryClient. Mount `<QueryClientProvider client={queryClient}>` once
 * in the root layout.
 */
import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // RN has no window-focus event; leave this off and refetch explicitly.
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Never retry an expired session or a business rejection — only
        // transport-level blips.
        if (error instanceof ApiError && !error.isNetwork && error.code !== 'SERVER') return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
