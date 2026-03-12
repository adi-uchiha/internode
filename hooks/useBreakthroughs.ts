import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  });
}

export function useCreateBreakthrough() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakthroughs'] });
    },
  });
}
