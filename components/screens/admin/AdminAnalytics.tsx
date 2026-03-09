'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAdminAnalytics } from '@/hooks/useAnalytics';

const AdminAnalytics = () => {
  const { data, isLoading } = useAdminAnalytics();

  const stats = [
    { label: 'Log Rate', value: data?.logRate || '...' },
    { label: 'Avg Resolve Time', value: data?.avgResolveTime || '...' },
    { label: 'Active Interns', value: data?.activeInterns || '...' },
    { label: 'Total Hours', value: data?.totalHours || '...' },
  ];

  return (
    <AdminLayout title="Analytics">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-border bg-card p-6">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              [{s.label}]
            </div>
            <div
              className={`font-display text-3xl font-bold ${isLoading ? 'text-muted-foreground animate-pulse' : 'text-primary'}`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
