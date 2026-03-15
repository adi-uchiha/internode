import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { type ActivityWithUser } from '@/hooks/useActivities';
import { type User } from '@/hooks/useUsers';

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

  /**
   * Ripple effect for user updates.
   */
  rippleUserUpdate: (queryClient: QueryClient, userId: string, updates: Partial<User>) => {
    CacheCore.updateInLists<ActivityWithUser>(queryClient, ['activities'], (activity) => {
      if (activity.userId === userId && activity.user) {
        return { ...activity, user: { ...activity.user, ...updates } };
      }
      return activity;
    });
  },
};
