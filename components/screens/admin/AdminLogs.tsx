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
                    <div className="font-mono text-xs text-muted-foreground">Log Entry</div>
                  </div>
                </div>
                {log.hasBlocker && (
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 font-mono text-[10px] uppercase tracking-wider">
                    Blocker
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold mb-2">What was done:</h3>
              <p className="font-mono text-sm text-foreground/80 mb-4 whitespace-pre-wrap">
                {log.whatIDid}
              </p>

              {log.skillTags && log.skillTags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {log.skillTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 border border-border font-mono text-[10px] opacity-80 hover:opacity-100 transition-opacity"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
