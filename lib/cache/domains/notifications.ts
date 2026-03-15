/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';

/**
 * Domain logic for Notification cache synchronization.
 */
export const NotificationDomain = {
  /**
   * Optimistically prepends a notification.
   */
  optimisticCreate: (queryClient: QueryClient, notification: Record<string, unknown>) => {
    CacheCore.prependToLists(queryClient, ['notifications'], notification as any);
  },

  /**
   * Marks a notification as read locally.
   */
  markAsRead: (queryClient: QueryClient, notificationId: string) => {
    CacheCore.updateInLists(queryClient, ['notifications'], {
      id: notificationId,
      read: true,
    } as any);
  },

  /**
   * Syncs notification data from the server.
   */
  sync: (queryClient: QueryClient, data: Record<string, unknown>) => {
    CacheCore.updateInLists(queryClient, ['notifications'], data as any);
  },
};
