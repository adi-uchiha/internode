'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { tmTickets, getMemberById, generateHeatmapData } from '@/data/taskManagerData';

export default function TimeLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Gather all time logs
  const allLogs = useMemo(() => {
    return tmTickets
      .flatMap((t) =>
        t.timeLogs.map((log) => ({ ...log, ticketTitle: t.title, ticketId: t.id }))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const logs = isAdmin ? allLogs : allLogs.filter((l) => l.memberId === 'tm-002');
  const totalHoursWeek = logs
    .filter((l) => l.date >= '2026-03-03')
    .reduce((s, l) => s + l.hours, 0);
  const totalHoursMonth = logs.reduce((s, l) => s + l.hours, 0);
  const avgPerDay = logs.length > 0 ? (totalHoursMonth / 7).toFixed(1) : '0';

  const heatmapData = useMemo(() => generateHeatmapData(), []);

  const getHeatmapIntensity = (hours: number) => {
    if (hours === 0) return 'bg-border/50';
    if (hours <= 2) return 'bg-primary/20';
    if (hours <= 4) return 'bg-primary/40';
    if (hours <= 6) return 'bg-primary/60';
    return 'bg-primary';
  };

  // Group heatmap by weeks
  const weeks = useMemo(() => {
    const result: (typeof heatmapData)[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      result.push(heatmapData.slice(i, i + 7));
    }
    return result;
  }, [heatmapData]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: isAdmin ? 'Team Hours This Week' : 'My Hours This Week',
            value: `${totalHoursWeek}h`,
          },
          {
            label: isAdmin ? 'Team Hours This Month' : 'My Hours This Month',
            value: `${totalHoursMonth}h`,
          },
          { label: 'Avg Hours / Day', value: `${avgPerDay}h` },
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
          <button className="font-mono text-xs text-muted-foreground border border-border px-3 py-1 hover:bg-muted transition-colors">
            [Export CSV]
          </button>
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
                const member = getMemberById(log.memberId);
                return (
                  <tr
                    key={log.id}
                    className={cn(
                      'border-b border-border/50 hover:bg-muted/10 transition-colors',
                      i % 2 === 0 ? '' : 'bg-muted/5'
                    )}
                  >
                    <td className="p-4 font-mono text-xs">{log.date}</td>
                    {isAdmin && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={member?.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full border border-border"
                          />
                          <span className="text-sm font-medium">{member?.name}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4 text-sm text-primary font-medium">{log.ticketTitle}</td>
                    <td className="p-4 font-mono text-xs font-bold text-right text-foreground">
                      {log.hours.toFixed(1)}h
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[300px] truncate">
                      {log.note}
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
              {week.map((day, di) => (
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
