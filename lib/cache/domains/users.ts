import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { type User } from '@/hooks/useUsers';
import { useUIStore } from '../../store/ui-store';

/**
 * Domain logic for User cache synchronization.
 */
export const UserDomain = {
  /**
   * Optimistically updates a user's heatmap or stats.
   * Section 3.8 Contribution Heatmap Increment
   */
  adjustStats: (queryClient: QueryClient, userId: string, statsDelta: Record<string, number>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CacheCore.updateInLists<User>(queryClient, ['users'], { id: userId, ...statsDelta } as any);

    // Also update single user cache if it exists
    queryClient.setQueryData(['users', userId], (old: User | undefined) => {
      if (!old) return old;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { ...old, ...statsDelta } as any;
    });
  },

  /**
   * Syncs user profile changes.
   */
  sync: (queryClient: QueryClient, data: User) => {
    CacheCore.updateInLists(queryClient, ['users'], data);
    queryClient.setQueryData(['users', data.id], data);
  },

  /**
   * Section 9.4: Binary & Asset Cache Management.
   * Performs a 'Soft Swap' of image URLs to prevent flickering.
   */
  softSwapImage: (queryClient: QueryClient, userId: string, newImageUrl: string) => {
    CacheCore.updateInLists<User>(queryClient, ['users'], {
      id: userId,
      image: newImageUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    CacheCore.updateItem(queryClient, ['users', userId], { image: newImageUrl });
  },

  /**
   * Section 9.5: Collaborative Presence Awareness.
   * Updates local presence state in the UI Store.
   */
  updatePresence: (userId: string, activePath: string) => {
    const { setPresence } = useUIStore.getState();
    setPresence(userId, { activePath, isOnline: true });
  },
};
