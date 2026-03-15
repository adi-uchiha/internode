import { QueryClient } from '@tanstack/react-query';
import { type TaskAnalyticsData } from '@/hooks/useAnalytics';

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
  adjustLoggedHours: (queryClient: QueryClient, hours: number) => {
    AnalyticsDomain.updateTasks(queryClient, (old) => {
      const today = new Date().toISOString().split('T')[0];

      // Update KPIs
      const nextKpis = {
        ...old.kpis,
        totalHours: old.kpis.totalHours + hours,
      };

      // Update Burn Rate chart
      const nextBurnRate = old.burnRate?.map((item) =>
        item.day === today ? { ...item, actual: item.actual + hours } : item
      );

      return {
        ...old,
        kpis: nextKpis,
        burnRate: nextBurnRate,
      };
    });
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

      // Simplified mapping of status string to graph keys
      const map = (s: string) => {
        if (s === 'todo') return 'todo' as const;
        if (s === 'in-progress' || s === 'in_progress') return 'inProgress' as const;
        if (s === 'in-review' || s === 'in_review') return 'inReview' as const;
        if (s === 'done') return 'done' as const;
        return null;
      };

      const fromKey = map(from);
      const toKey = map(to);

      if (fromKey)
        (weekEntry as unknown as Record<string, number>)[fromKey] = Math.max(
          0,
          (weekEntry as unknown as Record<string, number>)[fromKey] - 1
        );
      if (toKey)
        (weekEntry as unknown as Record<string, number>)[toKey] =
          ((weekEntry as unknown as Record<string, number>)[toKey] || 0) + 1;

      nextStatusFlow[currentWeekIndex] = weekEntry;

      return {
        ...old,
        statusFlow: nextStatusFlow,
      };
    });
  },
};
