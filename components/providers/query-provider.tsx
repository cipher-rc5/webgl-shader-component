'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useState } from 'react';
import { JSX } from 'react/jsx-runtime';

interface QueryProviderProps {
  readonly children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 5 * 60 * 1000, // 5 minutes
          retry: 1,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true
        }
      }
    })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
