'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SearchResults {
  tickets: Array<{ id: string; title: string; ticketId: string }>;
  projects: Array<{ id: string; name: string }>;
}

export function useSearch(query: string, enabled: boolean = true) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError } = useQuery<SearchResults>({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      apiClient.get<SearchResults>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    results: data || { tickets: [], projects: [] },
    isSearching: isLoading,
    isError,
  };
}
