import { QueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import { type searchHistory } from '@/db/schema';
import { CacheCore } from '../core';

type SearchHistoryItem = InferSelectModel<typeof searchHistory>;

/**
 * Domain logic for Search History cache synchronization.
 */
export const SearchDomain = {
  /**
   * Optimistically adds an item to search history.
   */
  addHistory: (queryClient: QueryClient, item: SearchHistoryItem) => {
    CacheCore.prependToLists(queryClient, ['searchHistory'], item, {
      identityCheck: (oldItem, newItem) =>
        oldItem.entityId === newItem.entityId && oldItem.entityType === newItem.entityType,
    });
  },

  /**
   * Cross-store sweep: Removes an entity from search history if it's deleted (Section 3.4).
   */
  removeEntity: (queryClient: QueryClient, entityId: string) => {
    queryClient.setQueryData(['searchHistory'], (old: SearchHistoryItem[] | undefined) => {
      if (!Array.isArray(old)) return old;
      return old.filter((item) => item.entityId !== entityId);
    });
  },
};
