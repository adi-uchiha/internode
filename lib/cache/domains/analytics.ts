import { QueryClient } from '@tanstack/react-query';
import { type TaskAnalyticsData, type LeaderboardEntry } from '@/hooks/useAnalytics';

/**
 * Domain-specific logic for Analytics cache updates.
 * Centralizes how KPIs and charts are Predicted optimistically.
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
   */
  adjustLoggedHours: (queryClient: QueryClient, hours: number, date?: string) => {
    AnalyticsDomain.updateTasks(queryClient, (old) => {
      const today = new Date().toISOString().split('T')[0];
      const targetDate = date || today;

      // Update KPIs
      const nextKpis = {
        ...old.kpis,
        totalHours: old.kpis.totalHours + hours,
      };

      // Update Burn Rate chart
      const nextBurnRate = old.burnRate?.map((item) =>
        item.day === targetDate ? { ...item, actual: item.actual + hours } : item
      );

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
  adjustLeaderboard: (queryClient: QueryClient, userId: string, hours: number) => {
    queryClient.setQueryData(
      ['analytics', 'leaderboard'],
      (old: LeaderboardEntry[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old
          .map((user) => {
            if (user.id !== userId) return user;
            const currentHours = parseFloat(user.hoursLogged || '0');
            return {
              ...user,
              hoursLogged: (currentHours + hours).toString(),
              ticketsDone: user.ticketsDone + (hours > 0 ? 0 : 0), // Hours doesn't strictly mean ticket done
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
    AnalyticsDomain.updateTasks(queryClient, (old) => {
      // Find current week or default to last entry
      const currentWeekIndex = old.statusFlow.length - 1;
      if (currentWeekIndex < 0) return old;

      const nextStatusFlow = [...old.statusFlow];
      const weekEntry = { ...nextStatusFlow[currentWeekIndex] };

      // Standardized mapping of status string to graph keys
      const map = (s: string) => {
        const normalized = s.toLowerCase().replace('_', '-');
        if (normalized === 'todo') return 'todo' as const;
        if (normalized === 'in-progress') return 'inProgress' as const;
        if (normalized === 'in-review') return 'inReview' as const;
        if (normalized === 'done') return 'done' as const;
        return null;
      };

      const fromKey = map(from);
      const toKey = map(to);

      if (fromKey === toKey) return old;

      if (fromKey) {
        (weekEntry as unknown as Record<string, number>)[fromKey] = Math.max(
          0,
          ((weekEntry as unknown as Record<string, number>)[fromKey] || 0) - 1
        );
      }

      if (toKey) {
        (weekEntry as unknown as Record<string, number>)[toKey] =
          ((weekEntry as unknown as Record<string, number>)[toKey] || 0) + 1;
      }

      nextStatusFlow[currentWeekIndex] = weekEntry;

      return {
        ...old,
        statusFlow: nextStatusFlow,
      };
    });
  },
};
