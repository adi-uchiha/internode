import { useQuery } from '@tanstack/react-query';

export interface AdminAnalyticsData {
  logRate: string;
  avgResolveTime: string;
  activeInterns: string;
  totalHours: string;
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
