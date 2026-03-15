import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { leaveRequests } from '@/db/schema';
import type { User } from './useUsers';
import { CacheCore } from '@/lib/cache/core';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';

export interface Leave {
  id: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  user?: {
    id: string;
    name: string;
    image?: string | null;
  };
}

export type LeaveRequestWithUser = InferSelectModel<typeof leaveRequests> & {
  user?: User;
};

export function useLeaves() {
  return useQuery<Leave[]>({
    queryKey: ['leaves'],
    queryFn: () => apiClient.get('/api/leaves'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { type: string; date: string; reason?: string }) =>
      apiClient.post<Leave>('/api/leaves', data),
    onMutate: async (newLeave) => {
      await queryClient.cancelQueries({ queryKey: ['leaves'] });
      const previousLeaves = queryClient.getQueryData(['leaves']);

      if (user) {
        CacheCore.prependToLists(queryClient, ['leaves'], {
          ...newLeave,
          id: 'temp-' + nanoid(),
          userId: user.id,
          status: 'pending',
          user: user as unknown as User,
          startDate: newLeave.date,
          endDate: newLeave.date,
          createdAt: new Date().toISOString(),
        });
      }

      return { previousLeaves };
    },
    onError: (err, newLeave, context) => {
      queryClient.setQueryData(['leaves'], context?.previousLeaves);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'], refetchType: 'none' });
    },
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'approved' | 'rejected' }) =>
      apiClient.patch<Leave>(`/api/leaves/${id}`, { status }),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['leaves'] });
      const previousLeaves = queryClient.getQueryData(['leaves']);

      CacheCore.updateInLists<Leave>(queryClient, ['leaves'], {
        id: updated.id,
        status: updated.status,
      });

      return { previousLeaves };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['leaves'], context?.previousLeaves);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'], refetchType: 'none' });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/leaves/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['leaves'] });
      const previousLeaves = queryClient.getQueryData(['leaves']);

      CacheCore.removeFromLists(queryClient, ['leaves'], id);

      return { previousLeaves };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['leaves'], context?.previousLeaves);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'], refetchType: 'none' });
    },
  });
}
