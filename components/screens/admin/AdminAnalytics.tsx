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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">System Analytics</h2>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">
            Real-time metric aggregation
          </p>
        </div>
        {data && (
          <div
            className={`px-3 py-1 border font-mono text-[10px] uppercase tracking-tighter ${data.isGlobal ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground'}`}
          >
            {data.isGlobal ? '● Global System Visibility' : '○ Organization Specific'}
          </div>
        )}
      </div>

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
