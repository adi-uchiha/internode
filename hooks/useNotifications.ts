import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { notifications } from '@/db/schema';
import { apiClient } from '@/lib/api-client';

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
    mutationFn: () => apiClient.patch('/api/notifications/read', {}),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          ['notifications'],
          previousNotifications.map((n) => ({ ...n, read: true }))
        );
      }

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'none' });
    },
  });
}
