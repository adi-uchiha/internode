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
      loggedHours: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TicketWithRelations;

    // 1. Update ticket lists with smart filter synergy
    CacheCore.prependToLists(queryClient, ['tickets'], augmentedTicket, (item, filters) => {
      const f = filters as Record<string, string>;
      // Match project filter
      if (f.projectId && !(item.projectIds || []).includes(f.projectId)) return false;
      // Match assignee filter
      if (f.assigneeId && item.assigneeId !== f.assigneeId) return false;
      return true;
    });

    // 2. Update analytics counters
    AnalyticsDomain.adjustStatusFlow(queryClient, augmentedTicket.status, 1);
    AnalyticsDomain.adjustTicketCounts(queryClient, { total: 1 });

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
    const oldTicket = queryClient.getQueryData<TicketWithRelations>(['tickets', id]);

    // 1. Prepare augmented update (hydrate IDs if changed)
    const augmentedUpdates = { ...updates } as Partial<TicketWithRelations>;
    if (updates.assigneeId !== undefined) {
      augmentedUpdates.assignee = CacheAugmenter.user(queryClient, updates.assigneeId);
    }
    if (updates.projectIds !== undefined) {
      augmentedUpdates.projects = CacheAugmenter.projects(queryClient, updates.projectIds);
    }

    // 2. Update in all list variations with filter awareness
    CacheCore.updateInLists(
      queryClient,
      ['tickets'],
      { id, ...augmentedUpdates },
      (item, filters) => {
        const f = filters as Record<string, string>;
        // Dynamically re-verify filters after update
        if (f.projectId && !(item.projectIds || []).includes(f.projectId)) return false;
        if (f.assigneeId && item.assigneeId !== f.assigneeId) return false;
        return true;
      }
    );

    // 3. Update single ticket view
    CacheCore.updateItem(queryClient, ['tickets', id], (old: TicketWithRelations | undefined) => {
      if (!old) return old;
      const next = { ...old, ...augmentedUpdates } as TicketWithRelations;

      // Incremental hours synergy
      if (updates.addLoggedHours) {
        next.loggedHours = (old.loggedHours || 0) + updates.addLoggedHours;
      }

      // Optimistic log insertion
      // @ts-expect-error - synergy property for internal cache updates
      if (updates.addTimeLog) {
        next.timeLogs = [
          // @ts-expect-error - log entry type mismatch
          updates.addTimeLog,
          ...(old.timeLogs || []),
        ];
      }

      return next;
    });

    // 4. Synergy with Lists (Iterate lists and apply same logic)
    const lists = queryClient.getQueryCache().findAll({ queryKey: ['tickets'] });
    lists.forEach((query) => {
      if (query.queryKey.length > 1 && query.queryKey[1] === id) return; // skip detail

      queryClient.setQueryData(query.queryKey, (old: TicketWithRelations[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) => {
          if (item.id !== id) return item;
          const next = { ...item, ...augmentedUpdates } as TicketWithRelations;
          if (updates.addLoggedHours) {
            next.loggedHours = (item.loggedHours || 0) + updates.addLoggedHours;
          }
          // @ts-expect-error - synergy property
          if (updates.addTimeLog) {
            // @ts-expect-error - log entry type mismatch
            next.timeLogs = [updates.addTimeLog, ...(item.timeLogs || [])];
          }
          return next;
        });
      });
    });

    // 5. Status Changes & Analytics synergy
    if (oldTicket) {
      const nextStatus = updates.status || oldTicket.status;
      if (updates.status && oldTicket.status !== updates.status) {
        AnalyticsDomain.moveTicketStatus(queryClient, oldTicket.status, updates.status);

        // Leaderboard completion synergy
        if (updates.status === 'done') {
          AnalyticsDomain.adjustLeaderboard(queryClient, oldTicket.assigneeId || 'system', 0, 1);
        } else if (oldTicket.status === 'done') {
          AnalyticsDomain.adjustLeaderboard(queryClient, oldTicket.assigneeId || 'system', 0, -1);
        }
      }

      // KPI Sync for In Progress
      if (nextStatus === 'in-progress' && oldTicket.status !== 'in-progress') {
        AnalyticsDomain.adjustTicketCounts(queryClient, { inProgress: 1 });
      } else if (
        oldTicket.status === 'in-progress' &&
        updates.status &&
        updates.status !== 'in-progress'
      ) {
        AnalyticsDomain.adjustTicketCounts(queryClient, { inProgress: -1 });
      }
    }

    return { id, updates: augmentedUpdates };
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
      id: (rawComment.id as string) || `temp-${Date.now()}`,
      ...rawComment,
      user: currentUser,
    };

    CacheCore.prependToLists(
      queryClient,
      ['comments', ticketId],
      augmentedComment as unknown as { id: string }
    );
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
    currentUser: User,
    note: string = 'Time logged',
    isBreakthrough: boolean = false,
    date?: string
  ) => {
    const logDate = date || new Date().toISOString();

    // 1. Create the fake log entry for the ticket detail view
    const tempLog = {
      id: `temp-log-${Date.now()}`,
      userId: currentUser.id,
      ticketId,
      hours,
      note,
      isBreakthrough,
      date: logDate,
      user: currentUser,
      createdAt: logDate,
      updatedAt: logDate,
    };

    // 2. Update the ticket's loggedHours and timeLogs in all caches
    TicketDomain.optimisticUpdate(queryClient, ticketId, {
      addLoggedHours: hours,
      // @ts-expect-error - synergy property for internal orchestration
      addTimeLog: tempLog,
    });

    // 3. Update analytics (burn rate and KPIs)
    AnalyticsDomain.adjustLoggedHours(queryClient, hours, logDate);

    // 4. Update leaderboard synergy
    AnalyticsDomain.adjustLeaderboard(queryClient, currentUser.id, hours);
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

    // Use CacheCore.updateInLists for consistency
    CacheCore.updateInLists(queryClient, ['tickets'], augmented);
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

    // 3. Adjust analytics synergy
    if (ticket) {
      AnalyticsDomain.adjustTicketCounts(queryClient, {
        total: -1,
        inProgress: ticket.status === 'in-progress' ? -1 : 0,
      });
      AnalyticsDomain.adjustStatusFlow(queryClient, ticket.status, -1);

      if (ticket.loggedHours) {
        AnalyticsDomain.adjustLoggedHours(queryClient, -ticket.loggedHours);
      }

      if (ticket.status === 'done') {
        AnalyticsDomain.adjustLeaderboard(queryClient, ticket.assigneeId || 'system', 0, -1);
      }
    }
  },
};
