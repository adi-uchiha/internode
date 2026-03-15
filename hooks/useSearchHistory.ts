import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CacheManager } from '@/lib/cache/manager';

export interface RecentSearch {
  id: string;
  entityType: 'ticket' | 'member' | 'project';
  entityId: string;
  title: string;
  subtitle?: string;
  lastAccessedAt: string;
}

export function useSearchHistory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['searchHistory'],
    queryFn: async () => {
      const res = await fetch('/api/search/history');
      if (!res.ok) throw new Error('Failed to fetch search history');
      return res.json() as Promise<RecentSearch[]>;
    },
    enabled: options?.enabled !== false,
  });
}

export function useLogSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Partial<RecentSearch>) => {
      const res = await fetch('/api/search/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Failed to log search');
      return res.json();
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['searchHistory'] });
      const previous = queryClient.getQueryData(['searchHistory']);

      CacheManager.search.addHistory(queryClient, {
        ...newItem,
        id: `temp-${Date.now()}`,
        lastAccessedAt: new Date().toISOString(),
      });

      return { previous };
    },
    onError: (err, item, context) => {
      queryClient.setQueryData(['searchHistory'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'], refetchType: 'none' });
    },
  });
}
