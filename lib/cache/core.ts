import { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Core cache utilities for robust, type-safe TanStack Query cache manipulation.
 */
export const CacheCore = {
  /**
   * Identifies if a query key matches a base key, even with filters/params.
   */
  isMatch: (key: QueryKey, baseKey: QueryKey) => {
    if (!Array.isArray(key) || !Array.isArray(baseKey)) return false;
    return baseKey.every((item, index) => key[index] === item);
  },

  /**
   * Updates an item in all queries matching the base key.
   * Useful for list views (like "all tickets") where the item might appear.
   */
  updateInLists: <T extends { id: string }>(
    queryClient: QueryClient,
    baseKey: QueryKey,
    updatedItem: Partial<T> & { id: string }
  ) => {
    queryClient.setQueriesData({ queryKey: baseKey }, (old: T[] | undefined) => {
      if (!Array.isArray(old)) return old;
      return old.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
    });
  },

  /**
   * Prepends an item to all lists matching the base key.
   */
  prependToLists: <T>(queryClient: QueryClient, baseKey: QueryKey, newItem: T) => {
    queryClient.setQueriesData({ queryKey: baseKey }, (old: T[] | undefined) => {
      if (!Array.isArray(old)) return [newItem];
      // Prevent duplicates
      const exists = old.some(
        (item) => (item as { id?: string }).id === (newItem as { id?: string }).id
      );
      if (exists && (newItem as { id?: string }).id) return old;
      return [newItem, ...old];
    });
  },

  /**
   * Removes an item from all lists matching the base key.
   */
  removeFromLists: <T extends { id: string }>(
    queryClient: QueryClient,
    baseKey: QueryKey,
    id: string
  ) => {
    queryClient.setQueriesData({ queryKey: baseKey }, (old: T[] | undefined) => {
      if (!Array.isArray(old)) return old;
      return old.filter((item) => item.id !== id);
    });
  },

  /**
   * Deeply merges an update into a single item cache.
   */
  updateItem: <T>(queryClient: QueryClient, queryKey: QueryKey, update: Partial<T>) => {
    queryClient.setQueryData(queryKey, (old: T | undefined) => {
      if (!old) return old;
      return { ...old, ...update };
    });
  },
};
