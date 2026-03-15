/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';

/**
 * Domain logic for Activity cache synchronization.
 */
export const ActivityDomain = {
  /**
   * Optimistically prepends an activity to the feed.
   */
  optimisticCreate: (queryClient: QueryClient, activity: Record<string, unknown>) => {
    CacheCore.prependToLists(queryClient, ['activities'], activity as any);
  },

  /**
   * Syncs activity data from the server.
   */
  sync: (queryClient: QueryClient, data: Record<string, unknown>) => {
    CacheCore.updateInLists(queryClient, ['activities'], data as any);
  },
};
