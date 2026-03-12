import { Icon } from '@iconify/react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAdminAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminReports = () => {
  const { data: stats, isLoading } = useAdminAnalytics();

  const handleDownload = (type: string) => {
    toast.info(`Generating ${type} report...`);
    // Future: Connect to a PDF generation worker
  };

  return (
    <AdminLayout title="System Reports">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Quick Report Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-lg mb-2">Weekly Performance</h3>
              <p className="font-mono text-xs text-muted-foreground mb-4">
                Summary of all time logs, ticket resolutions, and breakthroughs for the current
                week.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDownload('Weekly')}>
              <Icon icon="solar:download-minimalistic-linear" className="w-4 h-4 mr-2" />
              DOWNLOAD PDF
            </Button>
          </div>
          <div className="border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-lg mb-2">Monthly Audit</h3>
              <p className="font-mono text-xs text-muted-foreground mb-4">
                Detailed breakdown of project progress, hours spent, and team efficiency metrics.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDownload('Monthly')}>
              <Icon icon="solar:download-minimalistic-linear" className="w-4 h-4 mr-2" />
              DOWNLOAD PDF
            </Button>
          </div>
        </div>

        {/* Current Period Snapshot */}
        <div className="border border-border bg-card p-8">
          <div className="flex items-center gap-2 font-mono text-xs text-primary uppercase tracking-wider mb-6">
            <Icon icon="solar:graph-up-linear" className="w-4 h-4" />
            [PERIOD_SNAPSHOT]
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Icon
                icon="solar:refresh-linear"
                className="w-8 h-8 animate-spin text-muted-foreground"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase mb-1">
                  Total Hours
                </div>
                <div className="font-display text-2xl font-bold">{stats?.totalHours || 0}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase mb-1">
                  Active Interns
                </div>
                <div className="font-display text-2xl font-bold">{stats?.activeInterns || 0}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase mb-1">
                  Avg Resolution
                </div>
                <div className="font-display text-2xl font-bold">
                  {stats?.avgResolveTime || 'N/A'}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase mb-1">
                  Log Health
                </div>
                <div className="font-display text-2xl font-bold">{stats?.logRate || '0%'}</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border border-blue-500/20 bg-blue-500/5 flex items-start gap-4">
          <Icon icon="solar:info-circle-linear" className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-blue-500/80 leading-relaxed">
            Report generation utilizes historical data snapshots taken every Friday at UTC 00:00.
            Real-time data is used for the period snapshot above.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
