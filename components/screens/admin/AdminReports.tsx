'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';

const AdminReports = () => (
  <AdminLayout title="Reports">
    <div className="border border-border bg-card p-6">
      <p className="font-mono text-muted-foreground">
        Generate weekly/monthly PDF reports for team performance.
      </p>
    </div>
  </AdminLayout>
);

export default AdminReports;
