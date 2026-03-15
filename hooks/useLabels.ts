import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CacheCore } from '@/lib/cache/core';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export function useLabels() {
  return useQuery<Label[]>({
    queryKey: ['labels'],
    queryFn: () => apiClient.get('/api/labels'),
    staleTime: 24 * 60 * 60 * 1000, // Labels are very static, cache for 1 day
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: { name: string; color: string }) =>
      apiClient.post<Label>('/api/labels', label),
    onMutate: async (newLabel) => {
      await queryClient.cancelQueries({ queryKey: ['labels'] });
      const previousLabels = queryClient.getQueryData(['labels']);

      CacheCore.prependToLists(queryClient, ['labels'], {
        ...newLabel,
        id: 'temp-' + nanoid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { previousLabels };
    },
    onError: (err, newLabel, context) => {
      queryClient.setQueryData(['labels'], context?.previousLabels);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'], refetchType: 'none' });
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/labels?id=${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['labels'] });
      const previousLabels = queryClient.getQueryData(['labels']);

      CacheCore.removeFromLists(queryClient, ['labels'], id);

      return { previousLabels };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['labels'], context?.previousLabels);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'none' }); // Labels appear in tickets
    },
  });
}
