'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useLogs } from '@/hooks/useLogs';
import { Icon } from '@iconify/react';

const AdminLogs = () => {
  const { data: logs = [], isLoading } = useLogs();

  return (
    <AdminLayout title="Daily Logs">
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse font-mono flex items-center justify-center gap-2">
            <Icon icon="solar:spinner-linear" className="animate-spin w-4 h-4" /> Loading team
            logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-mono border border-dashed border-border">
            No daily logs submitted yet.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="border border-border bg-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-border overflow-hidden rounded-full shrink-0 relative">
                    {/* Temporary placeholder for user info, ideally we expand useLogs to populate relations */}
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Icon icon="solar:user-linear" className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-semibold">
                      {new Date(log.date).toLocaleDateString()}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      Log Entry - {log.hours}h
                    </div>
                  </div>
                </div>
                {log.isBreakthrough && (
                  <span className="px-2 py-1 bg-primary/10 text-primary font-mono text-[10px] uppercase tracking-wider">
                    Breakthrough
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold mb-2">Note:</h3>
              <p className="font-mono text-sm text-foreground/80 mb-4 whitespace-pre-wrap">
                {log.note}
              </p>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
