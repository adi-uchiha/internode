import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { type ActivityWithUser } from '@/hooks/useActivities';

/**
 * Domain logic for Activity cache synchronization.
 */
export const ActivityDomain = {
  /**
   * Optimistically prepends an activity to the feed.
   */
  optimisticCreate: (queryClient: QueryClient, activity: ActivityWithUser) => {
    CacheCore.prependToLists(queryClient, ['activities'], activity);
  },

  /**
   * Syncs activity data from the server.
   */
  sync: (queryClient: QueryClient, data: ActivityWithUser) => {
    CacheCore.updateInLists(queryClient, ['activities'], data);
  },
};
