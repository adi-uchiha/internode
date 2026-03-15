'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiClientError } from '@/lib/api-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof ApiClientError) {
              console.error('[Global Query Error]', error);
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof ApiClientError) {
              console.error('[Global Mutation Error]', error);
            } else if (error instanceof Error) {
              toast.error(error.message);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    // Section 9.1: Cross-Tab Synchronization
    const unsubscribe = broadcastQueryClient({
      queryClient: queryClient as unknown as Parameters<
        typeof broadcastQueryClient
      >[0]['queryClient'],
      broadcastChannel: 'internode-cache-sync',
    });
    return () => unsubscribe();
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
