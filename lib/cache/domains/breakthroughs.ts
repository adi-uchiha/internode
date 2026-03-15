import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { Breakthrough } from '@/hooks/useBreakthroughs';

/**
 * Domain logic for Breakthrough cache synchronization.
 */
export const BreakthroughDomain = {
  /**
   * Optimistically adds a breakthrough.
   */
  optimisticCreate: (queryClient: QueryClient, breakthrough: Breakthrough) => {
    CacheCore.prependToLists(queryClient, ['breakthroughs'], breakthrough);
  },

  /**
   * Optimistically updates a breakthrough.
   */
  optimisticUpdate: (queryClient: QueryClient, updated: Partial<Breakthrough> & { id: string }) => {
    CacheCore.updateInLists(queryClient, ['breakthroughs'], updated);
  },

  /**
   * Optimistically deletes a breakthrough.
   */
  optimisticDelete: (queryClient: QueryClient, id: string) => {
    CacheCore.removeFromLists(queryClient, ['breakthroughs'], id);
  },

  /**
   * Syncs breakthrough changes.
   */
  sync: (queryClient: QueryClient, data: Breakthrough) => {
    CacheCore.updateInLists(queryClient, ['breakthroughs'], data);
    queryClient.setQueryData(['breakthroughs', data.id], data);
  },
};
