'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';

const AdminSettings = () => (
  <AdminLayout title="Team Settings">
    <div className="border border-border bg-card p-6">
      <p className="font-mono text-muted-foreground">
        Manage team settings, invite interns, and configure notifications.
      </p>
    </div>
  </AdminLayout>
);

export default AdminSettings;
