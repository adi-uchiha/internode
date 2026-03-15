import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';
import { CacheCore } from '@/lib/cache/core';

export interface User {
  id: string;
  name: string;
  image?: string | null;
}

export interface Breakthrough {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  description: string;
  skillTags: string[] | null;
  prLink: string | null;
  adminComment: string | null;
  date: string;
  user?: User;
}

export function useBreakthroughs() {
  return useQuery<Breakthrough[]>({
    queryKey: ['breakthroughs'],
    queryFn: async () => {
      const res = await fetch('/api/breakthroughs');
      if (!res.ok) throw new Error('Failed to fetch breakthroughs');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBreakthrough() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<Breakthrough>) => {
      const res = await fetch('/api/breakthroughs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to log breakthrough');
      return res.json();
    },
    onMutate: async (newBreakthrough) => {
      await queryClient.cancelQueries({ queryKey: ['breakthroughs'] });
      const previousBreakthroughs = queryClient.getQueryData(['breakthroughs']);

      if (user) {
        CacheCore.prependToLists(queryClient, ['breakthroughs'], {
          ...newBreakthrough,
          id: 'temp-' + nanoid(),
          userId: user.id,
          user: {
            id: user.id,
            name: user.name || 'Anonymous User',
            image: user.image,
          },
          date: new Date().toISOString(),
        } as unknown as Breakthrough);
      }

      return { previousBreakthroughs };
    },
    onError: (err, newBreakthrough, context) => {
      queryClient.setQueryData(['breakthroughs'], context?.previousBreakthroughs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['breakthroughs'], refetchType: 'none' });
    },
  });
}

export function useUpdateBreakthrough() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Breakthrough> & { id: string }) => {
      const res = await fetch(`/api/breakthroughs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update breakthrough');
      return res.json();
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['breakthroughs'] });
      const previousBreakthroughs = queryClient.getQueryData(['breakthroughs']);

      CacheCore.updateInLists<Breakthrough>(queryClient, ['breakthroughs'], updated);

      return { previousBreakthroughs };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['breakthroughs'], context?.previousBreakthroughs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['breakthroughs'], refetchType: 'none' });
    },
  });
}

export function useDeleteBreakthrough() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/breakthroughs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete breakthrough');
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['breakthroughs'] });
      const previousBreakthroughs = queryClient.getQueryData(['breakthroughs']);

      CacheCore.removeFromLists(queryClient, ['breakthroughs'], id);

      return { previousBreakthroughs };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['breakthroughs'], context?.previousBreakthroughs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['breakthroughs'], refetchType: 'none' });
    },
  });
}
