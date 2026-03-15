import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { notifications } from '@/db/schema';
import { apiClient } from '@/lib/api-client';
import { CacheManager } from '@/lib/cache/manager';

export type Notification = InferSelectModel<typeof notifications>;

export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/notifications'),
    staleTime: 60 * 1000, // Stay fresh for 1 minute
    refetchInterval: 60000, // Poll every 60 seconds
    enabled: options?.enabled ?? true,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id?: string) =>
      id
        ? apiClient.patch(`/api/notifications/${id}/read`, {})
        : apiClient.patch('/api/notifications/read', {}),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications']);

      if (id) {
        CacheManager.notifications.markAsRead(queryClient, id);
      } else {
        // Bulk mark as read
        queryClient.setQueryData(['notifications'], (old: Notification[] | undefined) => {
          if (!Array.isArray(old)) return old;
          return old.map((n) => ({ ...n, read: true }));
        });
      }

      return { previousNotifications };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['notifications'], context?.previousNotifications);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'none' });
    },
  });
}
