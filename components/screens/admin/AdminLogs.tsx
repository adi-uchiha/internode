'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { mockDailyLogs } from '@/data/mockData';

const AdminLogs = () => (
  <AdminLayout title="Daily Logs">
    <div className="space-y-4">
      {mockDailyLogs.map((log) => (
        <div key={log.id} className="border border-border bg-card p-6">
          <div className="flex justify-between mb-4">
            <div className="font-mono text-xs text-muted-foreground">{log.date}</div>
            {log.hasBlocker && (
              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 font-mono text-xs">
                BLOCKER
              </span>
            )}
          </div>
          <h3 className="font-display font-semibold mb-2">What was done:</h3>
          <p className="font-mono text-sm text-muted-foreground mb-4">{log.whatIDid}</p>
          <div className="flex gap-2">
            {log.skillTags.map((tag) => (
              <span key={tag} className="px-2 py-1 border border-border font-mono text-xs">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </AdminLayout>
);

export default AdminLogs;
