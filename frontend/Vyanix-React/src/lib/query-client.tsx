'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              if (failureCount >= 2) return false;
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status: number }).status;
                if (status >= 400) return false;
              }
              return true;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient();
  }
  return new QueryClient();
}

export function serverQueryClient() {
  return new QueryClient();
}

export function dehydrateQuery(client: QueryClient) {
  return null;
}
