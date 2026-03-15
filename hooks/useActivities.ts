import { useQuery } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import { type activities } from '@/db/schema';
import { type User } from './useUsers';
import { apiClient } from '@/lib/api-client';

export type ActivityWithUser = InferSelectModel<typeof activities> & {
  user: User;
};

export function useActivities(params?: { userId?: string; type?: string; limit?: number }) {
  const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery<ActivityWithUser[]>({
    queryKey: ['activities', params],
    queryFn: () => apiClient.get(`/api/activities${query ? `?${query}` : ''}`),
    staleTime: 5 * 60 * 1000,
  });
}
