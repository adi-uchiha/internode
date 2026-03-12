import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InferSelectModel } from 'drizzle-orm';
import type { tickets, comments, timeLogs } from '@/db/schema';
import type { User } from './useUsers';

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
  project?: { id: string; name: string } | null;
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
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
    },
  });
}

export function useLogTime() {
  const queryClient = useQueryClient();

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
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
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.ticketId] });
    },
  });
}
