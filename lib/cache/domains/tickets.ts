import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { CacheAugmenter } from '../augmenter';
import { AnalyticsDomain } from './analytics';
import {
  type TicketWithRelations,
  type TimeLogWithUser,
  type CommentWithUser,
} from '@/hooks/useTickets';
import { type User } from '@/hooks/useUsers';

export type TicketUpdatePayload = Partial<TicketWithRelations> & {
  addLoggedHours?: number;
  addTimeLog?: TimeLogWithUser;
};

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
    CacheCore.prependToLists(queryClient, ['tickets'], augmentedTicket, {
      filterPredicate: (item, filters) => {
        const f = filters as Record<string, string>;
        // Match project filter
        if (f.projectId && !(item.projectIds || []).includes(f.projectId)) return false;
        // Match assignee filter
        if (f.assigneeId && item.assigneeId !== f.assigneeId) return false;
        return true;
      },
    });

    // 2. Local list update handled by prependToLists in step 1.
    return augmentedTicket;
  },

  /**
   * Optimistically updates a ticket status, priority, or other field.
   * Focuses strictly on ticket entity state. Synergies are handled by the Registry.
   */
  optimisticUpdate: (queryClient: QueryClient, id: string, updates: TicketUpdatePayload) => {
    // Get existing ticket to preserve rich relations if they haven't changed
    const existing = queryClient.getQueryData<TicketWithRelations>(['tickets', id]);

    // 1. Prepare augmented update (hydrate IDs if changed)
    const augmentedUpdates = { ...updates } as Partial<TicketWithRelations>;

    if (updates.assigneeId !== undefined) {
      if (existing?.assigneeId === updates.assigneeId && existing.assignee) {
        augmentedUpdates.assignee = existing.assignee;
      } else {
        augmentedUpdates.assignee = CacheAugmenter.user(queryClient, updates.assigneeId);
      }
    }

    if (updates.projectIds !== undefined) {
      // Small optimization: If project IDs are same, keep existing objects
      const existingProjectIds = (existing?.projectIds || []).sort().join(',');
      const newProjectIds = (updates.projectIds || []).sort().join(',');

      if (existingProjectIds === newProjectIds && existing?.projects) {
        augmentedUpdates.projects = existing.projects;
      } else {
        augmentedUpdates.projects = CacheAugmenter.projects(queryClient, updates.projectIds);
      }
    }

    // 2. Update in all list variations (Board, List, Projects, etc.)
    CacheCore.updateInLists<TicketWithRelations>(
      queryClient,
      ['tickets'],
      (item) => {
        if (item.id !== id) return item;

        const next = { ...item, ...augmentedUpdates } as TicketWithRelations;

        // Incremental hours synergy inside the ticket object for all list items
        if (updates.addLoggedHours) {
          next.loggedHours = (item.loggedHours || 0) + updates.addLoggedHours;
        }

        if (updates.addTimeLog) {
          next.timeLogs = [updates.addTimeLog, ...(item.timeLogs || [])];
        }

        return next;
      },
      (item, filters) => {
        const f = filters as Record<string, string>;
        // Re-verify filters: If an update moves the ticket out of current view (e.g. project changed)
        if (f.projectId && !(item.projectIds || []).includes(f.projectId)) return false;
        if (f.assigneeId && item.assigneeId !== f.assigneeId) return false;
        return true;
      }
    );

    // 3. Update single ticket detail view
    CacheCore.updateItem(queryClient, ['tickets', id], (old: TicketWithRelations | undefined) => {
      if (!old) return old;
      const next = { ...old, ...augmentedUpdates } as TicketWithRelations;

      // Incremental hours synergy inside the ticket object
      if (updates.addLoggedHours) {
        next.loggedHours = (old.loggedHours || 0) + updates.addLoggedHours;
      }

      if (updates.addTimeLog) {
        next.timeLogs = [updates.addTimeLog, ...(old.timeLogs || [])];
      }

      return next;
    });

    return { id, updates: augmentedUpdates };
  },

  /**
   * Optimistically adds a comment to a ticket.
   */
  optimisticCreateComment: (
    queryClient: QueryClient,
    ticketId: string,
    rawComment: Partial<CommentWithUser>, // Comment model plus local extras
    currentUser: User
  ) => {
    const augmentedComment = {
      id: rawComment.id || `temp-${Date.now()}`,
      organizationId: currentUser.organizationId || '',
      userId: currentUser.id,
      ticketId,
      content: '',
      ...rawComment,
      user: currentUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CommentWithUser;

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
    currentUser: User,
    note: string = 'Time logged',
    isBreakthrough: boolean = false,
    date?: string
  ) => {
    const logDate = date || new Date().toISOString();

    // 1. Create the fake log entry for the ticket detail view
    const tempLog: TimeLogWithUser = {
      id: `temp-log-${Date.now()}`,
      organizationId: currentUser.organizationId || '',
      userId: currentUser.id,
      ticketId,
      hours,
      note,
      isBreakthrough,
      adminComment: null,
      date: date ? new Date(date) : new Date(),
      user: currentUser,
      createdAt: new Date(),
    };

    // 2. Update the ticket's loggedHours and timeLogs in all caches
    TicketDomain.optimisticUpdate(queryClient, ticketId, {
      addLoggedHours: hours,
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
    const existing = queryClient.getQueryData<TicketWithRelations>(['tickets', id]);

    const augmented = {
      ...rawResponse,
      createdBy:
        rawResponse.createdBy ||
        (existing?.createdById === rawResponse.createdById ? existing.createdBy : undefined) ||
        CacheAugmenter.user(queryClient, rawResponse.createdById),
      assignee:
        rawResponse.assignee ||
        (existing?.assigneeId === rawResponse.assigneeId ? existing.assignee : undefined) ||
        CacheAugmenter.user(queryClient, rawResponse.assigneeId),
      projects:
        rawResponse.projects && rawResponse.projects.length > 0
          ? rawResponse.projects
          : CacheAugmenter.projects(queryClient, rawResponse.projectIds ?? []),
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
    // 1. Remove from lists and detail view
    CacheCore.removeFromLists(queryClient, ['tickets'], id);
    queryClient.removeQueries({ queryKey: ['tickets', id] });

    // 3. Synergy handles the rest via dispatch
  },

  /**
   * Resolve a ticket from cache.
   */
  resolve: (queryClient: QueryClient, id: string): TicketWithRelations | undefined => {
    return queryClient.getQueryData<TicketWithRelations>(['tickets', id]);
  },

  /**
   * Cross-entity ripple: Updates all cached tickets when a user's profile changes.
   * Ensures UI fidelity for assigned/created tickets (Blueprint Section 3.7/9.4).
   */
  rippleUserUpdate: (queryClient: QueryClient, userId: string, updates: Partial<User>) => {
    CacheCore.updateInLists<TicketWithRelations>(queryClient, ['tickets'], (ticket) => {
      let changed = false;
      const next = { ...ticket };
      if (ticket.assigneeId === userId && ticket.assignee) {
        next.assignee = { ...ticket.assignee, ...updates };
        changed = true;
      }
      if (ticket.createdById === userId && ticket.createdBy) {
        next.createdBy = { ...ticket.createdBy, ...updates };
        changed = true;
      }
      return changed ? next : ticket;
    });
  },
};
