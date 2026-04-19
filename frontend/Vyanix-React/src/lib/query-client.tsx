'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status === 401) return false; // 401 is handled by the interceptor + refresh flow, don't let React Query retry
          if (status >= 400) return false;
        }
        return true;
      },
      retryDelay: 0,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function getQueryClient() {
  return queryClient;
}

export function clearQueryCache() {
  queryClient.clear();
}

export function serverQueryClient() {
  return new QueryClient();
}

export function dehydrateQuery(client: QueryClient) {
  return null;
}
