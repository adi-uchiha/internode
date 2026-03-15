import { QueryClient } from '@tanstack/react-query';
import { CacheCore } from '../core';
import { type TaskAnalyticsData, type LeaderboardEntry } from '@/hooks/useAnalytics';
import { calculateEfficiency } from '@/lib/ticket-utils';

/**
 * Domain-specific logic for Analytics cache updates.
 * Centralizes how KPIs and charts are synced optimistically.
 */
export const AnalyticsDomain = {
  /**
   * Optimistically updates the task analytics cache.
   */
  updateTasks: (
    queryClient: QueryClient,
    updater: (old: TaskAnalyticsData) => TaskAnalyticsData
  ) => {
    queryClient.setQueryData(['analytics', 'tasks'], (old: TaskAnalyticsData | undefined) => {
      if (!old) return old;
      return updater(old);
    });
  },

  /**
   * Helper to increment/decrement ticket counters.
   */
  adjustTicketCounts: (
    queryClient: QueryClient,
    { total = 0, inProgress = 0 }: { total?: number; inProgress?: number }
  ) => {
    AnalyticsDomain.updateTasks(queryClient, (old) => ({
      ...old,
      kpis: {
        ...old.kpis,
        ticketsTotal: old.kpis.ticketsTotal + total,
        inProgress: old.kpis.inProgress + inProgress,
      },
    }));
  },

  /**
   * Helper to adjust total logged hours in analytics.
   * Updates both the KPI and the daily burn rate chart.
   */
  adjustLoggedHours: (queryClient: QueryClient, hours: number, date?: string) => {
    AnalyticsDomain.updateTasks(queryClient, (old) => {
      const today = new Date().toISOString().split('T')[0];
      const targetDate = date ? new Date(date).toISOString().split('T')[0] : today;

      // 1. Update KPIs
      const nextKpis = {
        ...old.kpis,
        totalHours: old.kpis.totalHours + hours,
      };

      // 2. Update Burn Rate chart
      let nextBurnRate = [...(old.burnRate || [])];
      const dayEntry = nextBurnRate.find((item) => item.day === targetDate);

      if (dayEntry) {
        nextBurnRate = nextBurnRate.map((item) =>
          item.day === targetDate ? { ...item, actual: item.actual + hours } : item
        );
      } else if (hours !== 0) {
        // Only add a new entry if we are actually adding hours
        nextBurnRate.push({
          day: targetDate,
          actual: hours,
          estimated: 0,
        });
        // Keep it sorted by date
        nextBurnRate.sort((a, b) => a.day.localeCompare(b.day));
      }

      return {
        ...old,
        kpis: nextKpis,
        burnRate: nextBurnRate,
      };
    });
  },

  /**
   * Optimistically updates the leaderboard.
   */
  adjustLeaderboard: (
    queryClient: QueryClient,
    userId: string,
    hours: number,
    ticketsDone: number = 0
  ) => {
    queryClient.setQueryData(
      ['analytics', 'leaderboard'],
      (old: LeaderboardEntry[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old
          .map((user) => {
            if (user.id !== userId) return user;
            const currentHours = parseFloat(user.hoursLogged || '0') + hours;
            const currentTickets = user.ticketsDone + ticketsDone;

            return {
              ...user,
              hoursLogged: currentHours.toString(),
              ticketsDone: currentTickets,
              efficiency: calculateEfficiency(currentTickets, currentHours),
            };
          })
          .sort((a, b) => parseFloat(b.hoursLogged) - parseFloat(a.hoursLogged));
      }
    );
  },

  /**
   * Optimistically moves a ticket in the status flow chart.
   */
  moveTicketStatus: (queryClient: QueryClient, from: string, to: string) => {
    AnalyticsDomain.adjustStatusFlow(queryClient, from, -1);
    AnalyticsDomain.adjustStatusFlow(queryClient, to, 1);
  },

  /**
   * Helper to adjust specific status counts in the current week.
   */
  adjustStatusFlow: (queryClient: QueryClient, status: string, delta: number) => {
    AnalyticsDomain.updateTasks(queryClient, (old) => {
      if (!Array.isArray(old.statusFlow) || old.statusFlow.length === 0) return old;

      const currentWeekIndex = old.statusFlow.length - 1;
      const nextStatusFlow = [...old.statusFlow];
      const weekEntry = { ...(nextStatusFlow[currentWeekIndex] || {}) };

      const map = (s: string) => {
        if (!s) return null;
        const normalized = s.toLowerCase().replace('_', '-');
        if (normalized === 'todo') return 'todo' as const;
        if (normalized === 'in-progress') return 'inProgress' as const;
        if (normalized === 'in-review') return 'inReview' as const;
        if (normalized === 'done') return 'done' as const;
        return null;
      };

      const key = map(status);
      if (!key) return old;

      const weekEntryWithKey = weekEntry as unknown as Record<string, number>;
      weekEntryWithKey[key] = Math.max(0, (weekEntryWithKey[key] || 0) + delta);
      nextStatusFlow[currentWeekIndex] = weekEntry as TaskAnalyticsData['statusFlow'][number];

      return { ...old, statusFlow: nextStatusFlow };
    });
  },

  /**
   * Section 9.2: Derived State Drift Reconciliation.
   */
  reconcileTasks: (queryClient: QueryClient, serverSnapshot: TaskAnalyticsData) => {
    CacheCore.reconcileDrift(queryClient, ['analytics', 'tasks'], serverSnapshot);
  },

  reconcileLeaderboard: (queryClient: QueryClient, serverSnapshot: LeaderboardEntry[]) => {
    CacheCore.reconcileDrift(queryClient, ['analytics', 'leaderboard'], serverSnapshot);
  },
};
