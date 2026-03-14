import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CacheCore } from '@/lib/cache/core';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';

export interface Breakthrough {
  id: string;
  userId: string;
  title: string;
  description: string;
  skillTags: string[] | null;
  prLink: string | null;
  adminComment: string | null;
  date: string;
  user?: Record<string, unknown>;
}

export function useBreakthroughs() {
  return useQuery({
    queryKey: ['breakthroughs'],
    queryFn: async () => {
      const res = await fetch('/api/breakthroughs');
      if (!res.ok) throw new Error('Failed to fetch breakthroughs');
      return res.json() as Promise<Breakthrough[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBreakthrough() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (breakthrough: Partial<Breakthrough>) => {
      const res = await fetch('/api/breakthroughs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(breakthrough),
      });
      if (!res.ok) throw new Error('Failed to create breakthrough');
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
          user: user as unknown as Record<string, unknown>,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        } as unknown as Breakthrough);
      }

      return { previousBreakthroughs };
    },
    onError: (err, newBreakthrough, context) => {
      queryClient.setQueryData(['breakthroughs'], context?.previousBreakthroughs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['breakthroughs'] });
    },
  });
}
