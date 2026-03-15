import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';
import { CacheManager } from '@/lib/cache/manager';

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
    queryFn: () => apiClient.get('/api/breakthroughs'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBreakthrough() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const activeOrganizationId = session?.session.activeOrganizationId;

  return useMutation({
    mutationFn: (data: Partial<Breakthrough>) =>
      apiClient.post<Breakthrough>('/api/breakthroughs', data),
    onMutate: async (newBreakthrough) => {
      await queryClient.cancelQueries({ queryKey: ['breakthroughs'] });
      const previousBreakthroughs = queryClient.getQueryData(['breakthroughs']);

      if (user) {
        const breakthrough = {
          ...newBreakthrough,
          id: 'temp-' + nanoid(),
          userId: user.id,
          user: {
            id: user.id,
            name: user.name || 'Anonymous User',
            image: user.image,
          },
          date: new Date().toISOString(),
        } as unknown as Breakthrough;

        queryClient.setQueryData(['breakthroughs'], (old: Breakthrough[] | undefined) => [
          breakthrough,
          ...(old || []),
        ]);

        // Dispatch synergy for celebration/notifications
        CacheManager.dispatch(queryClient, 'breakthroughs.created', {
          breakthrough,
          orgId: activeOrganizationId,
          orgName: 'the organization', // Fallback for now
        });
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
    mutationFn: ({ id, ...data }: Partial<Breakthrough> & { id: string }) =>
      apiClient.patch<Breakthrough>(`/api/breakthroughs/${id}`, data),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['breakthroughs'] });
      const previousBreakthroughs = queryClient.getQueryData(['breakthroughs']);

      CacheManager.breakthroughs.optimisticUpdate(queryClient, updated);

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
    mutationFn: (id: string) => apiClient.delete(`/api/breakthroughs/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['breakthroughs'] });
      const previousBreakthroughs = queryClient.getQueryData(['breakthroughs']);

      CacheManager.breakthroughs.optimisticDelete(queryClient, id);

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
