/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';

/**
 * Domain logic for Search History cache synchronization.
 */
export const SearchDomain = {
  /**
   * Optimistically adds an item to search history.
   */
  addHistory: (queryClient: QueryClient, item: unknown) => {
    CacheCore.prependToLists(queryClient, ['searchHistory'], item as any);
  },

  /**
   * Cross-store sweep: Removes an entity from search history if it's deleted (Section 3.4).
   */
  removeEntity: (queryClient: QueryClient, entityId: string) => {
    queryClient.setQueryData(['searchHistory'], (old: unknown[] | undefined) => {
      if (!Array.isArray(old)) return old;
      return old.filter((item) => (item as any).entityId !== entityId);
    });
  },
};
