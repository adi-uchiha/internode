import { QueryClient } from '@tanstack/react-query';
import { AnalyticsDomain } from './domains/analytics';
import { TicketDomain } from './domains/tickets';
import { ActivityDomain } from './domains/activities';
import { NotificationDomain } from './domains/notifications';
import { SearchDomain } from './domains/search';
import { CacheCore } from './core';
import { CacheAugmenter } from './augmenter';
import { useUIStore } from '../store/ui-store';

import {
  type TicketWithRelations,
  type CommentWithUser,
  type TimeLogWithUser,
} from '@/hooks/useTickets';
import { type Breakthrough } from '@/hooks/useBreakthroughs';
import { type User } from '@/hooks/useUsers';
import { type Project } from '@/hooks/useProjects';
import { type Leave } from '@/hooks/useLeaves';
import { type OrganizationDetails } from '@/hooks/useOrganization';

/**
 * Synergy Event Payloads
 */
export interface SynergyPayloads {
  'tickets.created': { ticket: TicketWithRelations };
  'tickets.deleted': { ticket?: TicketWithRelations };
  'tickets.statusChanged': {
    from: string;
    to: string;
    ticketId: string;
    assigneeId?: string | null;
    ticketTitle: string;
    orgId?: string;
  };
  'timeLogs.created': {
    ticketId: string;
    hours: number;
    userId: string;
    date: string;
    note?: string;
  };
  'comments.created': { ticketId: string; comment: CommentWithUser; user: User };
  'projects.updated': { projectId: string; updates: Partial<Project> };
  'members.joined': { member: User; orgName: string };
  'breakthroughs.created': { breakthrough: Breakthrough; orgId?: string | null; orgName: string };
  'leaves.created': { leave: Leave; userName: string };
  'leaves.statusChanged': { leaveId: string; status: string; userId: string };
  'organizations.updated': { updates: Partial<OrganizationDetails> };
}

/**
 * Pure Transformer Function type.
 */
export type Transformer<K extends keyof SynergyPayloads> = (
  queryClient: QueryClient,
  payload: SynergyPayloads[K]
) => void;

/**
 * The Sync Registry maps event keys to arrays of pure transformer functions.
 */
export const SyncRegistry: { [K in keyof SynergyPayloads]?: Transformer<K>[] } = {
  'tickets.created': [
    (qc, { ticket }) => {
      AnalyticsDomain.adjustTicketCounts(qc, { total: 1 });
      AnalyticsDomain.adjustStatusFlow(qc, ticket.status, 1);
      ActivityDomain.optimisticCreate(qc, {
        id: `activity-${Date.now()}`,
        type: 'created',
        action: 'created ticket',
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        userId: (ticket.createdBy as User)?.id || 'system',
        user: ticket.createdBy!,
        createdAt: new Date(),
        organizationId: ticket.organizationId || '',
      });
    },
  ],
  'tickets.deleted': [
    (qc, { ticket }) => {
      if (!ticket) return;
      AnalyticsDomain.adjustTicketCounts(qc, {
        total: -1,
        inProgress: ticket.status === 'in-progress' ? -1 : 0,
      });
      AnalyticsDomain.adjustStatusFlow(qc, ticket.status, -1);
      if (ticket.loggedHours) {
        AnalyticsDomain.adjustLoggedHours(qc, -ticket.loggedHours);
      }
      if (ticket.status === 'done') {
        AnalyticsDomain.adjustLeaderboard(qc, ticket.assigneeId || 'system', 0, -1);
      }
      // Section 3.4: Cross-Store Sweep for Search History
      SearchDomain.removeEntity(qc, ticket.id);
    },
  ],
  'tickets.statusChanged': [
    (qc, { from, to, assigneeId, ticketTitle, orgId, ticketId }) => {
      AnalyticsDomain.moveTicketStatus(qc, from, to);
      if (to === 'done') {
        AnalyticsDomain.adjustLeaderboard(qc, assigneeId || 'system', 0, 1);
      } else if (from === 'done') {
        AnalyticsDomain.adjustLeaderboard(qc, assigneeId || 'system', 0, -1);
      }

      if (to === 'in-progress' && from !== 'in-progress') {
        AnalyticsDomain.adjustTicketCounts(qc, { inProgress: 1 });
      } else if (from === 'in-progress' && to !== 'in-progress') {
        AnalyticsDomain.adjustTicketCounts(qc, { inProgress: -1 });
      }

      // Notification synergy (Section 6.1)
      if (assigneeId) {
        const user = CacheAugmenter.user(qc, assigneeId);
        NotificationDomain.optimisticCreate(qc, {
          id: `notif-${Date.now()}`,
          userId: assigneeId,
          type: 'status',
          title: 'Ticket Status Updated',
          subtitle: `Ticket "${ticketTitle}" moved from ${from} to ${to}`,
          ticketId,
          read: false,
          user,
          createdAt: new Date(),
          organizationId: orgId || user?.organizationId || '',
        });
      }
    },
  ],
  'timeLogs.created': [
    (qc, { ticketId, hours, userId, date, note }) => {
      const user = CacheAugmenter.user(qc, userId);
      if (!user) return;
      const tempLog: TimeLogWithUser = {
        id: `activity-log-${Date.now()}`,
        organizationId: user.organizationId || '',
        userId: user.id,
        ticketId: ticketId,
        hours,
        note: note || 'Time logged via synergy',
        isBreakthrough: false,
        adminComment: null,
        user,
        date: new Date(),
        createdAt: new Date(),
      };
      TicketDomain.optimisticUpdate(qc, ticketId, {
        addLoggedHours: hours,
        addTimeLog: tempLog,
      });

      // Section 3.2: Over-Budget Detection Synergy
      const t = TicketDomain.resolve(qc, ticketId);
      if (t && (t.loggedHours || 0) > (t.estimatedHours || 0) && t.estimatedHours! > 0) {
        TicketDomain.optimisticUpdate(qc, ticketId, {
          // @ts-expect-error - synergy flag for UI
          isOverBudget: true,
        });
      }

      AnalyticsDomain.adjustLoggedHours(qc, hours, date);
      AnalyticsDomain.adjustLeaderboard(qc, userId, hours);

      // Section 3.5: Project Runtime Synergy
      if (t?.projectIds) {
        t.projectIds.forEach((pid: string) => {
          // Increment project runtime
          CacheCore.updateItem<Project>(qc, ['projects', pid], (old) => {
            if (!old) return old;
            return {
              ...old,
              totalRuntime: (old.totalRuntime || 0) + hours,
            };
          });
        });
      }

      // Activity ripple (Section 3.1)
      ActivityDomain.optimisticCreate(qc, {
        id: `activity-log-${Date.now()}`,
        type: 'time-log',
        action: 'logged time',
        ticketId: ticketId,
        ticketTitle: null,
        userId: user.id || 'system',
        user,
        createdAt: new Date(),
        organizationId: user.organizationId || '',
      });
    },
  ],
  'comments.created': [
    (qc, { ticketId, user }) => {
      ActivityDomain.optimisticCreate(qc, {
        id: `activity-comment-${Date.now()}`,
        type: 'comment',
        action: 'commented',
        ticketId: ticketId,
        ticketTitle: null,
        userId: user.id || 'system',
        user,
        createdAt: new Date(),
        organizationId: user.organizationId || '',
      });
    },
  ],
  'projects.updated': [
    (qc, { updates }) => {
      if (updates.color) {
        // Section 3.7: Branding Ripple Synergy
        const { setBrandingColor } = useUIStore.getState();
        setBrandingColor(updates.color);
      }
    },
  ],
  'members.joined': [
    (qc, { member, orgName }) => {
      // Notification to all Owners/Admins (simplified - usually we'd filter members list)
      NotificationDomain.optimisticCreate(qc, {
        id: `notif-join-${Date.now()}`,
        userId: member.id,
        type: 'member-joined',
        title: 'New Member Joined',
        subtitle: `${member.name} has joined ${orgName}`,
        read: false,
        user: member, // Actual user object
        createdAt: new Date(),
        organizationId: member.organizationId || '',
      });
    },
  ],
  'organizations.updated': [
    (qc, { updates }) => {
      if (updates.brandingColor) {
        const { setBrandingColor } = useUIStore.getState();
        setBrandingColor(updates.brandingColor);
      }
      // Ripple to all projects/members if organization status changes
      // Removed tactical invalidation as per instruction
    },
  ],
  'breakthroughs.created': [
    (qc, { breakthrough, orgName, orgId }) => {
      const user = CacheAugmenter.user(qc, breakthrough.userId || null);
      NotificationDomain.optimisticCreate(qc, {
        id: `notif-breakthrough-${Date.now()}`,
        userId: breakthrough.userId || 'system',
        type: 'breakthrough',
        title: 'New Breakthrough Reached!',
        subtitle: `${breakthrough.title} completed for ${orgName}`,
        read: false,
        user: user!,
        createdAt: new Date(),
        organizationId: orgId || user?.organizationId || '',
      });

      // Collaborative Celebration (Zustand)
      // This is volatile UI state
      // const { setPresence } = useUIStore.getState();
      // We could add a 'celebration' flag to presence or a global broadcast

      // Leaderboard bonus
      AnalyticsDomain.adjustLeaderboard(qc, breakthrough.userId || 'system', 0, 5); // 5 points bonus
    },
  ],
  'leaves.created': [
    (qc, { leave, userName }) => {
      const user = CacheAugmenter.user(qc, leave.userId);
      // Notification to Admins
      NotificationDomain.optimisticCreate(qc, {
        id: `notif-leave-${Date.now()}`,
        userId: leave.userId,
        type: 'leave-requested',
        title: 'New Leave Request',
        subtitle: `${userName} requested leave for ${leave.date}`,
        read: false,
        user,
        createdAt: new Date(),
        organizationId: user?.organizationId || '',
      });
    },
  ],
  'leaves.statusChanged': [
    (qc, { status, userId }) => {
      const user = CacheAugmenter.user(qc, userId);
      // Notification to the User
      NotificationDomain.optimisticCreate(qc, {
        id: `notif-leave-status-${Date.now()}`,
        userId,
        type: 'leave-status',
        title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        subtitle: `Your leave request has been ${status}`,
        read: false,
        user,
        createdAt: new Date(),
        organizationId: user?.organizationId || '',
      });
    },
  ],
};

/**
 * Global dispatcher for cached synergy events.
 * Includes observability (telemetry) to track the ripple chain (Section 8).
 */
export function dispatchSynergy<K extends keyof SynergyPayloads>(
  queryClient: QueryClient,
  event: K,
  payload: SynergyPayloads[K]
) {
  const transformers = SyncRegistry[event];

  // Telemetry: Track the ripple chain in a hidden cache entry
  const timestamp = new Date().toISOString();
  queryClient.setQueryData(['__synergy_log'], (old: unknown[] | undefined) => {
    const logEntry = { event, payload, timestamp };
    const nextLogs = [logEntry, ...(old || [])].slice(0, 50); // Keep last 50 ripples
    return nextLogs;
  });

  if (transformers) {
    transformers.forEach((fn) => {
      fn(queryClient, payload);
    });
  }
}
