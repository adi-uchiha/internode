import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { leaveRequests } from '@/db/schema';
import type { User } from './useUsers';
import { CacheCore } from '@/lib/cache/core';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';

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
    queryFn: async () => {
      const res = await fetch('/api/leaves');
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ type, date, reason }: { type: string; date: string; reason?: string }) => {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, date, reason }),
      });
      if (!res.ok) throw new Error('Failed to submit leave request');
      return res.json();
    },
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
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'pending' | 'approved' | 'rejected';
    }) => {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update leave request');
      return res.json();
    },
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
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to cancel leave request');
      return res.json();
    },
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
