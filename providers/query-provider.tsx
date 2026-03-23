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
              // Only toast for generic queries if they are not background fetches or similar
              // Usually queries don't need toasts unless they are explicit page loads
              // But per user request, we keep detailed info
              toast.error(error.message, {
                description: `Error Code: ${error.code}`,
              });
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error instanceof ApiClientError) {
              toast.error(error.message, {
                description: `Error Code: ${error.code} ${error.details ? JSON.stringify(error.details) : ''}`,
              });
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
