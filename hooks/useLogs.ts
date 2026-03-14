import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { timeLogs } from '@/db/schema';

export type TimerLog = InferSelectModel<typeof timeLogs>;

export function useLogs(userId?: string) {
  return useQuery<TimerLog[]>({
    queryKey: ['logs', userId],
    queryFn: async () => {
      const url = userId ? `/api/logs?userId=${userId}` : '/api/logs';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TimerLog> & { id: string }) => {
      const res = await fetch(`/api/logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update log');
      return res.json();
    },
    onMutate: async (updatedLog) => {
      await queryClient.cancelQueries({ queryKey: ['logs'] });
      const previousLogs = queryClient.getQueryData(['logs']);

      queryClient.setQueriesData({ queryKey: ['logs'] }, (old: TimerLog[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((log) => (log.id === updatedLog.id ? { ...log, ...updatedLog } : log));
      });

      return { previousLogs };
    },
    onError: (err, updatedLog, context) => {
      queryClient.setQueryData(['logs'], context?.previousLogs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
