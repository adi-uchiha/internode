import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { leaveRequests } from '@/db/schema';
import type { User } from './useUsers';

export type LeaveRequestWithUser = InferSelectModel<typeof leaveRequests> & {
  user?: User;
};

export function useLeaves() {
  return useQuery<LeaveRequestWithUser[]>({
    queryKey: ['leaves'],
    queryFn: async () => {
      const res = await fetch('/api/leaves');
      if (!res.ok) throw new Error('Failed to fetch leave requests');
      return res.json();
    },
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}
