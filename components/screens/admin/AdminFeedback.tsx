'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';

const AdminFeedback = () => (
  <AdminLayout title="Feedback">
    <div className="border border-border bg-card p-6">
      <p className="font-mono text-muted-foreground">
        3 logs pending feedback. Review and provide mentorship comments.
      </p>
    </div>
  </AdminLayout>
);

export default AdminFeedback;
