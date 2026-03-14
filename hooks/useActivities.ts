import { useQuery } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import { type activities } from '@/db/schema';
import { type User } from './useUsers';

export type ActivityWithUser = InferSelectModel<typeof activities> & {
  user: User;
};

export function useActivities(params?: { userId?: string; type?: string; limit?: number }) {
  const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ActivityWithUser[]>({
    queryKey: ['activities', params],
    queryFn: async () => {
      const res = await fetch(`/api/activities${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
