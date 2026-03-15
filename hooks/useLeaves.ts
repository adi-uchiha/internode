import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { leaveRequests } from '@/db/schema';
import type { User } from './useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';
import { CacheManager } from '@/lib/cache/manager';

export interface Leave {
  id: string;
  userId: string;
  type: string;
  date: string;
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
        const leave = {
          ...newLeave,
          id: 'temp-' + nanoid(),
          userId: user.id,
          status: 'pending',
          user: user as unknown as User,
          date: newLeave.date,
          createdAt: new Date().toISOString(),
        } as unknown as Leave;

        queryClient.setQueryData(['leaves'], (old: Leave[] | undefined) => [leave, ...(old || [])]);

        CacheManager.dispatch(queryClient, 'leaves.created', {
          leave,
          userName: user.name,
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

      const existing = (previousLeaves as Leave[] | undefined)?.find((l) => l.id === updated.id);

      queryClient.setQueryData(['leaves'], (old: Leave[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((l) => (l.id === updated.id ? { ...l, status: updated.status } : l));
      });

      if (existing) {
        CacheManager.dispatch(queryClient, 'leaves.statusChanged', {
          leaveId: updated.id,
          status: updated.status,
          userId: existing.userId,
        });
      }

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

      queryClient.setQueryData(['leaves'], (old: Leave[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.filter((l) => l.id !== id);
      });

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
