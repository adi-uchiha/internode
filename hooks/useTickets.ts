import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { tickets, comments, timeLogs } from '@/db/schema';
import type { User } from './useUsers';
import { CacheManager } from '@/lib/cache/manager';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';

// Extended type mixing relations returned from drizzle `with` schema
export type CommentWithUser = InferSelectModel<typeof comments> & {
  user: User;
};

export type TimeLogWithUser = InferSelectModel<typeof timeLogs> & {
  user: User;
};

export type TicketWithRelations = InferSelectModel<typeof tickets> & {
  assignee?: User | null;
  createdBy?: User;
  projects?: { id: string; name: string }[];
  timeLogs?: TimeLogWithUser[];
};

export function useTickets(params?: { projectId?: string; assigneeId?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery<TicketWithRelations[]>({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const res = await fetch(`/api/tickets${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useTicket(id: string) {
  return useQuery<TicketWithRelations>({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch ticket');
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<InferSelectModel<typeof tickets>>) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      return res.json();
    },
    onMutate: async (newTicket) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      const previousTickets = queryClient.getQueryData(['tickets']);
      if (user) {
        CacheManager.tickets.optimisticCreate(
          queryClient,
          { ...newTicket, id: 'temp-' + nanoid() },
          user as unknown as User
        );
      }
      return { previousTickets };
    },
    onError: (err, newTicket, context) => {
      queryClient.setQueryData(['tickets'], context?.previousTickets);
    },
    onSuccess: (data) => {
      CacheManager.tickets.sync(queryClient, data);
    },
    onSettled: () => {
      // analytics invalidated because it depends on ticket count/status
      queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'none' });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<InferSelectModel<typeof tickets>> & { id: string; addLoggedHours?: number }) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      return res.json();
    },
    onMutate: async (updatedTicket) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', updatedTicket.id] });
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      const previousTicket = queryClient.getQueryData(['tickets', updatedTicket.id]);
      const previousTickets = queryClient.getQueryData(['tickets']);

      CacheManager.tickets.optimisticUpdate(queryClient, updatedTicket.id, updatedTicket);

      return { previousTicket, previousTickets };
    },
    onError: (err, updatedTicket, context) => {
      queryClient.setQueryData(['tickets', updatedTicket.id], context?.previousTicket);
      queryClient.setQueryData(['tickets'], context?.previousTickets);
    },
    onSuccess: (data) => {
      CacheManager.tickets.sync(queryClient, data);
    },
    onSettled: (data) => {
      // We rely on CacheManager.sync for the ticket update.
      // Invalidation is still called to mark it as stale, but we don't trigger refetch.
      queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'none' });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['tickets', data.id], refetchType: 'none' });
      }
    },
  });
}

export function useLogTime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      hours,
      note,
      isBreakthrough,
      date,
    }: {
      id: string;
      hours: number;
      note?: string;
      isBreakthrough?: boolean;
      date?: string;
    }) => {
      const res = await fetch(`/api/tickets/${id}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours, note, isBreakthrough, date }),
      });
      if (!res.ok) throw new Error('Failed to log time');
      return res.json();
    },
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', newLog.id] });
      await queryClient.cancelQueries({ queryKey: ['analytics'] });

      const previousTicket = queryClient.getQueryData(['tickets', newLog.id]);

      if (user) {
        CacheManager.tickets.optimisticLogTime(queryClient, newLog.id, newLog.hours);
      }

      return { previousTicket };
    },
    onError: (err, newLog, context) => {
      queryClient.setQueryData(['tickets', newLog.id], context?.previousTicket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'], refetchType: 'none' });
      // The ticket hours update is handled by optimistic update + settled refetch
    },
    onSettled: (data, error, variables) => {
      // Logs are refreshed manually if needed, but the ticket hours
      // are updated via optimistic update and confirmed by sync logic.
      queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'none' });
    },
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery<CommentWithUser[]>({
    queryKey: ['comments', ticketId],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to create comment');
      return res.json();
    },
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: ['comments', newComment.ticketId] });
      const previousComments = queryClient.getQueryData(['comments', newComment.ticketId]);

      if (user) {
        CacheManager.tickets.optimisticCreateComment(
          queryClient,
          newComment.ticketId,
          { ...newComment, id: 'temp-' + nanoid(), createdAt: new Date().toISOString() },
          user as unknown as User
        );
      }

      return { previousComments };
    },
    onError: (err, newComment, context) => {
      queryClient.setQueryData(['comments', newComment.ticketId], context?.previousComments);
    },
    onSettled: (_, __, variables) => {
      // Use refetchType: 'none' to avoid follow-up fetch after comment creation
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.ticketId],
        refetchType: 'none',
      });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete ticket');
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      await queryClient.cancelQueries({ queryKey: ['tickets', id] });

      const previousTickets = queryClient.getQueryData(['tickets']);
      CacheManager.tickets.optimisticDelete(queryClient, id);

      return { previousTickets };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['tickets'], context?.previousTickets);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'none' });
    },
  });
}
