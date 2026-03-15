import { useQuery } from '@tanstack/react-query';

export interface AdminAnalyticsData {
  isGlobal: boolean;
  logRate: string;
  avgResolveTime: string;
  activeInterns: string;
  totalHours: string;
}

export interface TaskAnalyticsData {
  kpis: {
    ticketsTotal: number;
    completionRate: number;
    highPriority: number;
    totalHours: number;
    activeContributors: number;
    // legacy support icons
    inProgress: number;
    overdue: number;
    teamHours: string;
  };
  weeklyTrends: {
    week: string;
    closed: number;
    created: number;
  }[];
  trends?: {
    tickets: number[];
    hours: number[];
    completion: number[];
    velocity: number[];
  };
  statusFlow: {
    week: string;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
  }[];
  projects: {
    name: string;
    tickets: number;
    hours: number;
  }[];
  heatmap: {
    date: string;
    count: number;
  }[];
  burnRate?: {
    day: string;
    actual: number;
    estimated: number;
  }[];
}

export function useAdminAnalytics() {
  return useQuery<AdminAnalyticsData>({
    queryKey: ['analytics', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/admin');
      if (!res.ok) throw new Error('Failed to fetch admin analytics');
      return res.json();
    },
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
