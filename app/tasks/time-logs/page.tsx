'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { useTickets } from '@/hooks/useTickets';
import { Icon } from '@iconify/react';
import { format, startOfWeek, subDays } from 'date-fns';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';

export default function TimeLogsPage() {
  const { user, orgRole } = useAuth();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';
  const { data: users } = useUsers();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  const logs = useMemo(() => {
    if (!tickets) return [];
    const flattenedLogs = tickets.flatMap((t) =>
      (t.timeLogs || []).map((l) => ({
        ...l,
        ticketTitle: t.title,
        ticketDbId: t.ticketId,
      }))
    );

    const filteredLogs = isAdmin
      ? flattenedLogs
      : flattenedLogs.filter((l) => l.userId === user?.id);

    return filteredLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tickets, isAdmin, user?.id]);

  const stats = useMemo(() => {
    if (!logs) return { week: 0, month: 0, avg: 0 };
    const now = new Date();
    const startWeek = startOfWeek(now, { weekStartsOn: 1 });
    const weekHours = logs
      .filter((l) => new Date(l.date) >= startWeek)
      .reduce((s, l) => s + (l.hours || 0), 0);
    const monthHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
    const avg = logs.length > 0 ? (monthHours / 30).toFixed(1) : '0';
    return { week: weekHours, month: monthHours, avg };
  }, [logs]);

  const heatmapData = useMemo(() => {
    const data: { date: string; hours: number }[] = [];
    const today = new Date();
    for (let i = 84; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const hours =
        logs
          ?.filter((l) => format(new Date(l.date), 'yyyy-MM-dd') === dateStr)
          .reduce((sum, l) => sum + (l.hours || 0), 0) || 0;
      data.push({ date: dateStr, hours });
    }
    return data;
  }, [logs]);

  const getHeatmapIntensity = (hours: number) => {
    if (hours === 0) return 'bg-border/50';
    if (hours <= 2) return 'bg-primary/20';
    if (hours <= 4) return 'bg-primary/40';
    if (hours <= 6) return 'bg-primary/60';
    return 'bg-primary';
  };

  const weeks = useMemo(() => {
    const result: (typeof heatmapData)[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      result.push(heatmapData.slice(i, i + 7));
    }
    return result;
  }, [heatmapData]);

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <UnifiedLoader message="LOADING_TEMPORAL_LOGS..." size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: isAdmin ? 'Team Hours This Week' : 'My Hours This Week',
            value: `${stats.week.toFixed(1)}h`,
          },
          {
            label: isAdmin ? 'Team Hours This Month' : 'My Hours This Month',
            value: `${stats.month.toFixed(1)}h`,
          },
          { label: 'Avg Hours / Day', value: `${stats.avg}h` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-border bg-card p-5"
          >
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              {stat.label}
            </div>
            <div className="font-display text-3xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border border-border bg-card overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <h3 className="font-display font-semibold">Time Log History</h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-sm">
              <tr>
                <th className="p-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Date
                </th>
                {isAdmin && (
                  <th className="p-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Member
                  </th>
                )}
                <th className="p-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Ticket
                </th>
                <th className="p-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest text-right">
                  Hours
                </th>
                <th className="p-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Work Note
                </th>
                <th className="p-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const member = users?.find((u) => u.id === log.userId);
                return (
                  <tr
                    key={log.id}
                    className={cn(
                      'border-b border-border/50 hover:bg-muted/10 transition-colors',
                      i % 2 === 0 ? '' : 'bg-muted/5'
                    )}
                  >
                    <td className="p-4 font-mono text-xs">
                      {format(new Date(log.date), 'yyyy-MM-dd')}
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center">
                            {member?.image ? (
                              <Image
                                src={member.image}
                                alt=""
                                width={20}
                                height={20}
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <Icon
                                icon="solar:user-linear"
                                className="w-3 h-3 text-muted-foreground"
                              />
                            )}
                          </div>
                          <span className="text-sm font-medium">{member?.name}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4 text-sm text-primary font-medium">
                      {log.ticketTitle}{' '}
                      <span className="text-muted-foreground text-[10px] font-mono">
                        [{log.ticketDbId.slice(0, 8)}]
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs font-bold text-right text-foreground">
                      {(log.hours || 0).toFixed(1)}h
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[300px] truncate">
                      {log.note || '---'}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                        ✓ Submitted
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Calendar Heatmap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold">Activity Heatmap</h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-border/50" />
              <div className="w-3 h-3 bg-primary/20" />
              <div className="w-3 h-3 bg-primary/40" />
              <div className="w-3 h-3 bg-primary/60" />
              <div className="w-3 h-3 bg-primary" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'w-3 h-3 transition-colors duration-300',
                    getHeatmapIntensity(day.hours),
                    'cursor-pointer hover:ring-1 hover:ring-primary hover:z-10'
                  )}
                  title={`${day.date}: ${day.hours}h`}
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
