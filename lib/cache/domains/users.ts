import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { type User } from '@/hooks/useUsers';
import { useUIStore } from '../../store/ui-store';
import { TicketDomain } from './tickets';
import { ActivityDomain } from './activities';
import { NotificationDomain } from './notifications';

/**
 * Domain logic for User cache synchronization.
 */
export const UserDomain = {
  /**
   * Optimistically updates a user's heatmap or stats.
   * Section 3.8 Contribution Heatmap Increment
   */
  adjustStats: (queryClient: QueryClient, userId: string, statsDelta: Partial<User>) => {
    CacheCore.updateInLists<User>(queryClient, ['users'], { id: userId, ...statsDelta });

    // Also update single user cache if it exists
    queryClient.setQueryData(['users', userId], (old: User | undefined) => {
      if (!old) return old;
      return { ...old, ...statsDelta };
    });

    // Ripple effect to all related entities
    TicketDomain.rippleUserUpdate(queryClient, userId, statsDelta);
    ActivityDomain.rippleUserUpdate(queryClient, userId, statsDelta);
    NotificationDomain.rippleUserUpdate(queryClient, userId, statsDelta);
  },

  /**
   * Syncs user profile changes.
   */
  sync: (queryClient: QueryClient, data: User) => {
    CacheCore.updateInLists(queryClient, ['users'], data);
    queryClient.setQueryData(['users', data.id], data);

    // Ripple effect to all related entities
    TicketDomain.rippleUserUpdate(queryClient, data.id, data);
    ActivityDomain.rippleUserUpdate(queryClient, data.id, data);
    NotificationDomain.rippleUserUpdate(queryClient, data.id, data);
  },

  /**
   * Section 9.4: Binary & Asset Cache Management.
   * Performs a 'Soft Swap' of image URLs to prevent flickering.
   */
  softSwapImage: (queryClient: QueryClient, userId: string, newImageUrl: string) => {
    CacheCore.updateInLists<User>(queryClient, ['users'], {
      id: userId,
      image: newImageUrl,
    });
    CacheCore.updateItem<User>(queryClient, ['users', userId], { image: newImageUrl });

    // Ripple effect to all related entities
    const updates = { image: newImageUrl };
    TicketDomain.rippleUserUpdate(queryClient, userId, updates);
    ActivityDomain.rippleUserUpdate(queryClient, userId, updates);
    NotificationDomain.rippleUserUpdate(queryClient, userId, updates);
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
