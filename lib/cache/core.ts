import { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Core cache utilities for robust, type-safe TanStack Query cache manipulation.
 */
export const CacheCore = {
  /**
   * Identifies if a query key matches a base key, including deep object comparison for filters.
   */
  isMatch: (key: QueryKey, baseKey: QueryKey) => {
    if (!Array.isArray(key) || !Array.isArray(baseKey)) return false;
    if (key.length < baseKey.length) return false;

    // Check base parts
    for (let i = 0; i < baseKey.length; i++) {
      const basePart = baseKey[i];
      const keyPart = key[i];

      if (typeof basePart === 'object' && basePart !== null) {
        if (JSON.stringify(basePart) !== JSON.stringify(keyPart)) return false;
      } else if (basePart !== keyPart) {
        return false;
      }
    }
    return true;
  },

  /**
   * Extracts filter parameters from a query key array.
   */
  getFilters: (key: QueryKey): Record<string, unknown> => {
    if (!Array.isArray(key)) return {};

    const lastPart = key[key.length - 1];
    return typeof lastPart === 'object' && lastPart !== null
      ? (lastPart as Record<string, unknown>)
      : {};
  },

  /**
   * Updates an item in all queries matching the base key.
   * Automatically handles filtering logic based on the query key's parameters.
   */
  updateInLists: <T extends { id: string }>(
    queryClient: QueryClient,
    baseKey: QueryKey,
    updatedItem: Partial<T> & { id: string },
    filterPredicate?: (item: T, filters: Record<string, unknown>) => boolean
  ) => {
    // In v5, setQueriesData updater only received 1 arg in some environments/versions.
    // Explicitly iterating via cache is safer and provides access to queryKey.
    const queries = queryClient.getQueryCache().findAll({ queryKey: baseKey });

    queries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (old: T[] | undefined) => {
        if (!Array.isArray(old)) return old;

        const filters = CacheCore.getFilters(query.queryKey);
        const isFiltered = Object.keys(filters).length > 0;

        return old
          .map((item) => {
            if (item.id !== updatedItem.id) return item;
            const merged = { ...item, ...updatedItem } as T;

            // If the predicate says it no longer matches the filters for this specific query, remove it.
            if (isFiltered && filterPredicate && !filterPredicate(merged, filters)) return null;
            return merged;
          })
          .filter((item): item is T => item !== null);
      });
    });
  },

  /**
   * Prepends an item to all lists matching the base key.
   * Automatically handles filtering logic based on the query key's parameters.
   */
  prependToLists: <T extends { id: string }>(
    queryClient: QueryClient,
    baseKey: QueryKey,
    newItem: T,
    filterPredicate?: (item: T, filters: Record<string, unknown>) => boolean
  ) => {
    const queries = queryClient.getQueryCache().findAll({ queryKey: baseKey });

    queries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (old: T[] | undefined) => {
        const filters = CacheCore.getFilters(query.queryKey);
        const isFiltered = Object.keys(filters).length > 0;

        // If it's a filtered list, decide if the item belongs
        if (isFiltered && filterPredicate && !filterPredicate(newItem, filters)) return old;

        if (!old) return [newItem];
        if (!Array.isArray(old)) return old;

        const newId = newItem.id;

        // Prevent duplicates
        if (newId && old.some((item) => (item as unknown as { id: string }).id === newId))
          return old;

        return [newItem, ...old];
      });
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
    const queries = queryClient.getQueryCache().findAll({ queryKey: baseKey });

    queries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (old: T[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.id !== id);
      });
    });
  },

  /**
   * Deeply merges an update into a single item cache.
   */
  updateItem: <T>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    update: Partial<T> | ((old: T) => T)
  ) => {
    queryClient.setQueryData(queryKey, (old: T | undefined) => {
      if (!old) return old;
      if (typeof update === 'function') {
        return update(old);
      }
      return { ...old, ...update };
    });
  },

  /**
   * Section 9.2: Derived State Drift Reconciliation.
   * Compares cached stats with a fresh server snapshot.
   */
  reconcileDrift: <T>(queryClient: QueryClient, queryKey: QueryKey, serverSnapshot: T) => {
    const cachedData = queryClient.getQueryData<T>(queryKey);
    if (!cachedData) return;

    // Deep comparison logic (simplified for numeric KPIs)
    const hasDrift = JSON.stringify(cachedData) !== JSON.stringify(serverSnapshot);

    if (hasDrift) {
      console.warn(`[Cache Synergy] Drift detected in ${queryKey.join('.')}. Reconciling...`);
      queryClient.setQueryData(queryKey, serverSnapshot);
      // Force invalidation to ensure all components are synced
      queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    }
  },
};
