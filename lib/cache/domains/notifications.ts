import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { type Notification } from '@/hooks/useNotifications';

/**
 * Domain logic for Notification cache synchronization.
 */
export const NotificationDomain = {
  /**
   * Optimistically prepends a notification.
   */
  optimisticCreate: (queryClient: QueryClient, notification: Notification) => {
    CacheCore.prependToLists(queryClient, ['notifications'], notification);
  },

  /**
   * Marks a notification as read locally.
   */
  markAsRead: (queryClient: QueryClient, notificationId: string) => {
    CacheCore.updateInLists<Notification>(queryClient, ['notifications'], {
      id: notificationId,
      read: true,
    });
  },

  /**
   * Syncs notification data from the server.
   */
  sync: (queryClient: QueryClient, data: Notification) => {
    CacheCore.updateInLists(queryClient, ['notifications'], data);
  },
};
