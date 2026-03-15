import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { tickets, comments, timeLogs } from '@/db/schema';
import type { User } from './useUsers';
import { CacheManager } from '@/lib/cache/manager';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';

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
    queryKey: params ? ['tickets', params] : ['tickets'],
    queryFn: () => apiClient.get(`/api/tickets${query ? `?${query}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useTicket(id: string) {
  return useQuery<TicketWithRelations>({
    queryKey: ['tickets', id],
    queryFn: () => apiClient.get(`/api/tickets/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: Partial<InferSelectModel<typeof tickets>>) =>
      apiClient.post<TicketWithRelations>('/api/tickets', data),
    onMutate: async (newTicket) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      const previousTickets = queryClient.getQueryData(['tickets']);
      if (user) {
        const ticket = CacheManager.tickets.optimisticCreate(
          queryClient,
          { ...newTicket, id: 'temp-' + nanoid() },
          user as unknown as User
        );
        // Dispatch synergy for analytics/activities
        CacheManager.dispatch(queryClient, 'tickets.created', { ticket });
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
      queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'none' });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<InferSelectModel<typeof tickets>> & { id: string; addLoggedHours?: number }) =>
      apiClient.patch<TicketWithRelations>(`/api/tickets/${id}`, data),
    onMutate: async (updatedTicket) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', updatedTicket.id] });
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      const previousTicket = queryClient.getQueryData<TicketWithRelations>([
        'tickets',
        updatedTicket.id,
      ]);
      const previousTickets = queryClient.getQueryData(['tickets']);

      // 1. Primary Entity Update
      CacheManager.tickets.optimisticUpdate(queryClient, updatedTicket.id, updatedTicket);

      // 2. Synergy Dispatch for status changes
      if (
        updatedTicket.status &&
        previousTicket &&
        updatedTicket.status !== previousTicket.status
      ) {
        CacheManager.dispatch(queryClient, 'tickets.statusChanged', {
          ticketId: updatedTicket.id,
          from: previousTicket.status,
          to: updatedTicket.status,
          assigneeId: previousTicket.assigneeId,
          ticketTitle: previousTicket.title,
        });
      }

      return { previousTicket, previousTickets };
    },
    onError: (
      err,
      updatedTicket,
      context: { previousTicket?: TicketWithRelations; previousTickets?: unknown } | undefined
    ) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['tickets', updatedTicket.id], context.previousTicket);
      }
      if (context?.previousTickets) {
        queryClient.setQueryData(['tickets'], context.previousTickets);
      }
    },
    onSuccess: (data) => {
      // Definitive sync with server response (Blueprint Section 10)
      if (data) {
        CacheManager.tickets.sync(queryClient, data);
      }
    },
    onSettled: (data) => {
      // Mark as stale for background sync (Blueprint Section 7.3)
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
    mutationFn: ({
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
    }) =>
      apiClient.post<TicketWithRelations>(`/api/tickets/${id}/time`, {
        hours,
        note,
        isBreakthrough,
        date,
      }),
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', newLog.id] });
      await queryClient.cancelQueries({ queryKey: ['analytics'] });
      await queryClient.cancelQueries({ queryKey: ['logs'] });

      const previousTicket = queryClient.getQueryData<TicketWithRelations>(['tickets', newLog.id]);

      if (user) {
        // 1. Dispatch the record creation synergy
        CacheManager.dispatch(queryClient, 'timeLogs.created', {
          ticketId: newLog.id,
          hours: newLog.hours,
          userId: user.id,
          date: newLog.date || new Date().toISOString(),
          note: newLog.note,
        });
      }

      return { previousTicket };
    },
    onError: (err, newLog, context: { previousTicket?: TicketWithRelations } | undefined) => {
      queryClient.setQueryData(['tickets', newLog.id], context?.previousTicket);
    },
    onSuccess: (data) => {
      // Reconcile hours definitive (Blueprint Section 9.2)
      if (data) {
        CacheManager.tickets.sync(queryClient, data);
      }
      queryClient.invalidateQueries({ queryKey: ['logs'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'none' });
    },
    onSettled: (data, error, variables) => {
      // Safety background marker
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id], refetchType: 'none' });
    },
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery<CommentWithUser[]>({
    queryKey: ['comments', ticketId],
    queryFn: () => apiClient.get(`/api/tickets/${ticketId}/comments`),
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      apiClient.post(`/api/tickets/${ticketId}/comments`, { content }),
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
    mutationFn: (id: string) => apiClient.delete(`/api/tickets/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      await queryClient.cancelQueries({ queryKey: ['tickets', id] });

      const previousTickets = queryClient.getQueryData(['tickets']);
      const ticket = queryClient.getQueryData<TicketWithRelations>(['tickets', id]);

      CacheManager.tickets.optimisticDelete(queryClient, id);

      // Dispatch synergy for analytics/activities
      CacheManager.dispatch(queryClient, 'tickets.deleted', { ticket });

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
