import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CacheCore } from '@/lib/cache/core';
import { nanoid } from 'nanoid';

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
    queryFn: async () => {
      const res = await fetch('/api/labels');
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // Labels are very static, cache for 1 day
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: { name: string; color: string }) => {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(label),
      });
      if (!res.ok) throw new Error('Failed to create label');
      return res.json();
    },
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
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/labels?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete label');
      return res.json();
    },
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
