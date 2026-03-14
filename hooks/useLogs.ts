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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
