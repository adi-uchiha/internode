'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';

const AdminAnalytics = () => (
  <AdminLayout title="Analytics">
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: 'Log Rate', value: '94%' },
        { label: 'Avg Resolve Time', value: '2.4h' },
        { label: 'Active Interns', value: '6' },
        { label: 'Total Hours', value: '1,918' },
      ].map((s) => (
        <div key={s.label} className="border border-border bg-card p-6">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
            [{s.label}]
          </div>
          <div className="font-display text-3xl font-bold text-primary">{s.value}</div>
        </div>
      ))}
    </div>
  </AdminLayout>
);

export default AdminAnalytics;
