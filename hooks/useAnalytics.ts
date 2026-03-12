import { useQuery } from '@tanstack/react-query';

export interface AdminAnalyticsData {
  logRate: string;
  avgResolveTime: string;
  activeInterns: string;
  totalHours: string;
}

export interface TaskAnalyticsData {
  kpis: {
    totalTickets: number;
    completedTickets: number;
    totalHours: number;
    overdue: number;
    avgVelocity: number;
    teamHours: string;
    inProgress: number;
  };
  burnRate: {
    day: string;
    actual: number;
    estimated: number;
  }[];
  projectHours: {
    project: string;
    actual: number;
    estimated: number;
    color: string;
  }[];
  trend: number[];
  trends: {
    tickets: number[];
    hours: number[];
    completion: number[];
    velocity: number[];
  };
}

export function useAdminAnalytics() {
  return useQuery<AdminAnalyticsData>({
    queryKey: ['analytics', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/admin');
      if (!res.ok) throw new Error('Failed to fetch admin analytics');
      return res.json();
    },
    // Keep analytics fresh but avoid spamming heavy queries
    staleTime: 5 * 60 * 1000,
  });
}

export function useTaskAnalytics() {
  return useQuery<TaskAnalyticsData>({
    queryKey: ['analytics', 'tasks'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/tasks');
      if (!res.ok) throw new Error('Failed to fetch task analytics');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
