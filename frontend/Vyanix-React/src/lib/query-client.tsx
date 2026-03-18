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
