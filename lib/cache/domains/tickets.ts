import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { CacheAugmenter } from '../augmenter';
import { AnalyticsDomain } from './analytics';
import { type TicketWithRelations } from '@/hooks/useTickets';
import { type User } from '@/hooks/useUsers';

/**
 * Domain logic for Ticket cache synchronization.
 * Handles the complex intersections between tickets, activities, and analytics.
 */
export const TicketDomain = {
  /**
   * Optimistically adds a new ticket to the cache.
   * Performs data augmentation for createdBy and project.
   */
  optimisticCreate: (
    queryClient: QueryClient,
    rawTicket: Partial<TicketWithRelations>,
    currentUser: User
  ) => {
    const augmentedTicket = {
      status: 'todo',
      ticketId: 'PENDING',
      ...rawTicket,
      createdBy: currentUser,
      assignee: CacheAugmenter.user(queryClient, rawTicket.assigneeId ?? null),
      projects: CacheAugmenter.projects(queryClient, rawTicket.projectIds ?? []),
      timeLogs: [],
    } as TicketWithRelations;

    // 1. Update ticket lists
    CacheCore.prependToLists(queryClient, ['tickets'], augmentedTicket);

    // 2. Update analytics counters
    const status = rawTicket.status || 'todo';
    AnalyticsDomain.adjustTicketCounts(queryClient, {
      total: 1,
      inProgress: status === 'in-progress' ? 1 : 0,
    });

    return augmentedTicket;
  },

  /**
   * Optimistically updates a ticket status, priority, or other field.
   * Handles status-flow synergy with analytics.
   */
  optimisticUpdate: (
    queryClient: QueryClient,
    id: string,
    updates: Partial<TicketWithRelations> & { addLoggedHours?: number }
  ) => {
    // 0. Capture the old state for synergy calculations before cache is modified
    const oldTicket = queryClient.getQueryData<TicketWithRelations>(['tickets', id]);

    // 1. Update in all list variations (including filtered lists)
    queryClient.setQueriesData(
      { queryKey: ['tickets'] },
      (old: TicketWithRelations[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) => {
          if (item.id !== id) return item;

          // Handle special additive updates like loggedHours
          const nextLoggedHours = updates.addLoggedHours
            ? (item.loggedHours || 0) + updates.addLoggedHours
            : (updates.loggedHours ?? item.loggedHours);

          return { ...item, ...updates, loggedHours: nextLoggedHours };
        });
      }
    );

    // 2. Update single ticket view
    queryClient.setQueryData(['tickets', id], (old: TicketWithRelations | undefined) => {
      if (!old) return old;
      const nextLoggedHours = updates.addLoggedHours
        ? (old.loggedHours || 0) + updates.addLoggedHours
        : (updates.loggedHours ?? old.loggedHours);
      return { ...old, ...updates, loggedHours: nextLoggedHours };
    });

    // 3. Status flow synergy
    if (updates.status && oldTicket && oldTicket.status !== updates.status) {
      AnalyticsDomain.moveTicketStatus(queryClient, oldTicket.status, updates.status);
    }

    return { id, updates };
  },

  /**
   * Optimistically adds a comment to a ticket.
   */
  optimisticCreateComment: (
    queryClient: QueryClient,
    ticketId: string,
    rawComment: Record<string, unknown>, // Comment model plus local extras
    currentUser: User
  ) => {
    const augmentedComment = {
      ...rawComment,
      user: currentUser,
    };

    CacheCore.prependToLists(queryClient, ['comments', ticketId], augmentedComment);
    return augmentedComment;
  },

  /**
   * Optimistically logs time to a ticket.
   * Cross-updates the ticket state, leaderboard, and analytics.
   */
  optimisticLogTime: (
    queryClient: QueryClient,
    ticketId: string,
    hours: number,
    userId: string,
    date?: string
  ) => {
    // 1. Update the ticket's loggedHours in all caches
    TicketDomain.optimisticUpdate(queryClient, ticketId, {
      addLoggedHours: hours,
    });

    // 2. Update analytics (burn rate and KPIs)
    AnalyticsDomain.adjustLoggedHours(queryClient, hours, date);

    // 3. Update leaderboard synergy
    AnalyticsDomain.adjustLeaderboard(queryClient, userId, hours);
  },

  /**
   * Synchronizes server response into the cache.
   * Hydrates the raw response before insertion.
   */
  sync: (queryClient: QueryClient, rawResponse: TicketWithRelations) => {
    const id = rawResponse.id;
    const augmented = {
      ...rawResponse,
      createdBy: CacheAugmenter.user(queryClient, rawResponse.createdById),
      assignee: CacheAugmenter.user(queryClient, rawResponse.assigneeId),
      projects: CacheAugmenter.projects(queryClient, rawResponse.projectIds ?? []),
    };

    // Use setQueriesData to update both global and filtered lists
    queryClient.setQueriesData(
      { queryKey: ['tickets'] },
      (old: TicketWithRelations[] | undefined) => {
        if (!Array.isArray(old)) return old;
        const exists = old.some((t) => t.id === id);
        if (exists) {
          return old.map((item) => (item.id === id ? augmented : item));
        }
        // If it's a filtered list and doesn't exist, we might not want to prepend
        // unless we know it matches the filter. For now, keep it safe.
        return old;
      }
    );

    CacheCore.updateItem(queryClient, ['tickets', id], augmented);
  },

  /**
   * Optimistically removes a ticket from all caches.
   * Updates analytics to reflect resource removal.
   */
  optimisticDelete: (queryClient: QueryClient, id: string) => {
    // 1. Get ticket data before deletion to adjust analytics
    const ticket = queryClient.getQueryData<TicketWithRelations>(['tickets', id]);

    // 2. Remove from lists and detail view
    CacheCore.removeFromLists(queryClient, ['tickets'], id);
    queryClient.removeQueries({ queryKey: ['tickets', id] });

    // 3. Adjust analytics
    if (ticket) {
      AnalyticsDomain.adjustTicketCounts(queryClient, {
        total: -1,
        inProgress: ticket.status === 'in-progress' ? -1 : 0,
      });
      if (ticket.loggedHours) {
        AnalyticsDomain.adjustLoggedHours(queryClient, -ticket.loggedHours);
      }
    }
  },
};
