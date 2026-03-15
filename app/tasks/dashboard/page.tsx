'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { format, startOfWeek, addDays } from 'date-fns';

import {
  getPriorityColor,
  getStatusColor,
  getStatusLabel,
  getTimeBarColor,
} from '@/lib/ticket-utils';

import { useTickets, useLogTime } from '@/hooks/useTickets';
import { useUsers } from '@/hooks/useUsers';
import { useTaskAnalytics } from '@/hooks/useAnalytics';
import { useActivities, type ActivityWithUser } from '@/hooks/useActivities';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from '@/lib/toast';
import Image from 'next/image';
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals';
import { cn } from '@/lib/utils';

const Sparkline = ({ data, color = 'hsl(140 100% 50%)' }: { data: number[]; color?: string }) => (
  <svg viewBox="0 0 70 20" className="w-full h-5">
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      points={data
        .map((v, i) => `${(i / (data.length - 1)) * 70},${20 - (v / Math.max(...data, 1)) * 18}`)
        .join(' ')}
    />
  </svg>
);

// Admin Dashboard
const AdminDashboardContent = () => {
  const { data: analytics, isLoading: analyticsLoading } = useTaskAnalytics();
  const { data: activities, isLoading: activitiesLoading } = useActivities({ limit: 10 });
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: users } = useUsers();

  const [activityFilter, setActivityFilter] = useState('all');

  if (analyticsLoading || ticketsLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-sm text-muted-foreground">
        <Icon icon="solar:refresh-linear" className="w-5 h-5 animate-spin mr-2" />
        LOADING_SYSTEM_DATA...
      </div>
    );
  }

  const overBudgetTickets = tickets?.filter((t) => t.loggedHours > t.estimatedHours) || [];

  const kpis = [
    {
      label: 'TOTAL TICKETS',
      value: analytics?.kpis.ticketsTotal || 0,
      sub: 'overall entries',
      subColor: 'text-primary',
      sparkData: analytics?.trends?.tickets || [0, 0, 0, 0, 0, 0, 0],
    },
    {
      label: 'IN PROGRESS',
      value: analytics?.kpis.inProgress || 0,
      sub: 'currently active',
      subColor: 'text-blue-400',
      sparkData: analytics?.trends?.velocity || [0, 0, 0, 0, 0, 0, 0],
    },
    {
      label: 'OVERDUE',
      value: analytics?.kpis.overdue || 0,
      sub: '⚠ needs attn',
      subColor: 'text-destructive',
      sparkData: analytics?.trends?.completion || [0, 0, 0, 0, 0, 0, 0],
      danger: true,
    },
    {
      label: 'TEAM HOURS',
      value: analytics?.kpis.teamHours || '0h',
      sub: 'this week',
      subColor: 'text-muted-foreground',
      sparkData: analytics?.trends?.hours || [0, 0, 0, 0, 0, 0, 0],
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`border border-border bg-card p-5 group hover:border-primary/50 transition-all ${
              kpi.danger ? 'ring-1 ring-destructive/20 bg-destructive/5' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest group-hover:text-primary">
                {kpi.label}
              </span>
              <div className="w-16">
                <Sparkline
                  data={kpi.sparkData}
                  color={kpi.danger ? '#ef4444' : 'hsl(var(--primary))'}
                />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{kpi.value}</span>
              <span className={`font-mono text-[10px] font-bold uppercase ${kpi.subColor}`}>
                {kpi.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Velocity Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Icon icon="solar:chart-square-linear" className="text-primary w-5 h-5" />
              Organizational Velocity
            </h3>
            <div className="flex gap-2">
              {['This Week', 'Last 2 Weeks', 'This Month'].map((t, i) => (
                <button
                  key={t}
                  className={`font-mono text-xs px-3 py-1 border transition-colors ${
                    i === 0
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full h-[220px]">
            {analytics?.burnRate && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.burnRate}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#666', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="estimated"
                    stroke="hsl(var(--muted-foreground)/0.5)"
                    strokeDasharray="5 5"
                    fill="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    fill="url(#actualGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 border border-border bg-card p-6 overflow-hidden relative"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            [ALERTS]
          </div>
          <h3 className="font-display font-semibold text-lg mb-4">Over-Budget Tickets</h3>
          {overBudgetTickets.length > 0 ? (
            <div className="space-y-3">
              {overBudgetTickets.slice(0, 4).map((t) => {
                const variance =
                  t.estimatedHours > 0
                    ? Math.round(((t.loggedHours - t.estimatedHours) / t.estimatedHours) * 100)
                    : 0;
                const member = users?.find((u) => u.id === t.assigneeId);
                return (
                  <div
                    key={t.id}
                    className="p-3 border border-border bg-muted/20 hover:border-destructive/30 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[10px] text-muted-foreground font-bold">
                        {t.ticketId}
                      </span>
                      <span className="font-mono text-[10px] text-destructive font-bold">
                        +{variance}%
                      </span>
                    </div>
                    <div className="font-display font-medium text-sm truncate mb-3 group-hover:text-destructive transition-colors">
                      {t.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                        {member?.image && (
                          <Image
                            src={member.image}
                            alt=""
                            width={20}
                            height={20}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {member?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center opacity-30">
              <Icon icon="solar:shield-check-linear" className="w-12 h-12 mb-2" />
              <p className="font-mono text-xs uppercase text-center">
                No critical variances detected
              </p>
            </div>
          )}
        </motion.div>

        {/* System Logs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Icon icon="solar:history-linear" className="text-primary w-5 h-5" />
              Core Activity Stream
            </h3>
            <div className="flex gap-4 font-mono text-[10px] uppercase">
              {['all', 'tickets', 'time-log', 'members'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActivityFilter(f)}
                  className={`transition-colors ${
                    activityFilter === f
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'time-log' ? 'RESOURCE' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {activities
              ?.filter(
                (a: ActivityWithUser) => activityFilter === 'all' || a.type === activityFilter
              )
              .map((activity: ActivityWithUser) => {
                const member = users?.find((u) => u.id === activity.userId);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 border-b border-border/50 group hover:bg-muted/10 transition-colors px-2"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                        {member?.image ? (
                          <Image src={member.image} alt="" width={32} height={32} unoptimized />
                        ) : (
                          <Icon icon="solar:user-linear" className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm">
                          <span className="font-bold text-primary mr-1 capitalize">
                            {member?.name || 'System'}
                          </span>
                          <span className="text-muted-foreground">{activity.action}</span>
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5 opacity-50">
                          {format(new Date(activity.createdAt), 'HH:mm:ss')} •{' '}
                          {activity.type === 'time-log' ? 'RES_LOG' : activity.type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-1 border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg">Project Vector Health</h3>
            <button className="font-mono text-[9px] text-primary uppercase border-b border-primary/30">
              Audit all
            </button>
          </div>
          <div className="space-y-6">
            {analytics?.projects.slice(0, 4).map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="font-display font-bold text-sm tracking-tight">{p.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase opacity-60">
                    {p.tickets} Units
                  </span>
                </div>
                <div className="h-2 bg-muted/30 border border-border/50 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 border border-border/50 bg-muted/10">
            <div className="font-mono text-[9px] text-muted-foreground uppercase mb-4 opacity-50">
              Operational Intensity
            </div>
            <div className="flex gap-1 overflow-hidden">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-4 h-4 border border-border/30',
                    i % 3 === 0 ? 'bg-primary/40' : i % 2 === 0 ? 'bg-primary/20' : 'bg-primary/5'
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Member Dashboard
const MemberDashboardContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: activities } = useActivities({ userId: user?.id, limit: 10 });
  const { data: users } = useUsers();

  const focusTicket = tickets?.find((t) => t.status === 'in-progress' && t.assigneeId === user?.id);
  const upcomingTickets =
    tickets?.filter((t) => t.status === 'todo' && t.assigneeId === user?.id) || [];

  // Weekly stats calculation from real logs (derived from tickets)
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyLogs = useMemo(() => {
    if (!tickets) return [];
    return tickets
      .flatMap((t) => t.timeLogs || [])
      .filter((l) => l.userId === user?.id && new Date(l.date) >= startOfCurrentWeek);
  }, [tickets, user?.id, startOfCurrentWeek]);

  const weeklyHours = weeklyLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

  const dailyHours = [0, 0, 0, 0, 0].map((_, i) => {
    const date = format(addDays(startOfCurrentWeek, i), 'yyyy-MM-dd');
    return weeklyLogs
      .filter((l) => format(new Date(l.date), 'yyyy-MM-dd') === date)
      .reduce((sum, l) => sum + (l.hours || 0), 0);
  });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Leaderboard calculation
  const leaderboard = useMemo(() => {
    if (!users || !tickets) return [];
    return users
      .map((u) => {
        const doneTickets = tickets.filter(
          (t) => t.assigneeId === u.id && t.status === 'done'
        ).length;
        const hours = tickets
          .filter((t) => t.assigneeId === u.id)
          .reduce((sum, t) => sum + (t.loggedHours || 0), 0);
        return {
          id: u.id,
          name: u.name,
          image: u.image,
          ticketsDone: doneTickets,
          hoursLogged: hours.toFixed(1),
          efficiency: hours > 0 ? Math.min(100, Math.round(((doneTickets * 4) / hours) * 100)) : 0,
        };
      })
      .sort((a, b) => b.ticketsDone - a.ticketsDone)
      .slice(0, 5);
  }, [users, tickets]);

  // Quick Log state
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogHours, setQuickLogHours] = useState('1');
  const [quickLogNote, setQuickLogNote] = useState('');
  const { mutateAsync: logTime, isPending: isLogging } = useLogTime();

  const handleQuickLog = async () => {
    if (!quickLogHours || parseFloat(quickLogHours) <= 0 || !focusTicket) return;
    try {
      await logTime({
        id: focusTicket.id,
        hours: parseFloat(quickLogHours),
        note: quickLogNote || 'Manual progress log',
        date: new Date().toISOString(),
      });
      toast.success(`Logged ${quickLogHours}h on "${focusTicket.title}"`);
      setShowQuickLog(false);
      setQuickLogHours('1');
      setQuickLogNote('');
    } catch {
      toast.error('Failed to log resource');
    }
  };

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-sm text-muted-foreground">
        <Icon icon="solar:refresh-linear" className="w-5 h-5 animate-spin mr-2" />
        LOADING_PERSONAL_ORGANIZATION...
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Operating Node Active
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tighter">WORKSPACE_ROOT</h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest opacity-60">
            Primary environment overview & task orchestration matrix.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          {/* My Focus */}
          {focusTicket && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border bg-card p-6"
            >
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                [MY FOCUS]
              </div>
              <div className="text-sm text-muted-foreground mb-2">Currently working on:</div>
              <div className="border border-border bg-background p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      getTimeBarColor(focusTicket.loggedHours, focusTicket.estimatedHours)
                    )}
                  />
                  <span className="font-display font-semibold flex-1">{focusTicket.title}</span>
                  <span
                    className={cn(
                      'font-mono text-[10px] uppercase px-2 py-0.5',
                      getStatusColor(focusTicket.status)
                    )}
                  >
                    {getStatusLabel(focusTicket.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    Ticket ID: {focusTicket.ticketId}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <div
                    className={cn('w-2 h-2 rounded-full', getPriorityColor(focusTicket.priority))}
                  />
                  <span className="font-mono text-xs capitalize">{focusTicket.priority}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full',
                        getTimeBarColor(focusTicket.loggedHours, focusTicket.estimatedHours)
                      )}
                      style={{
                        width: `${Math.min(
                          100,
                          (focusTicket.loggedHours / Math.max(focusTicket.estimatedHours, 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {focusTicket.loggedHours}h / {focusTicket.estimatedHours}h estimated
                  </span>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowQuickLog(true)}>
                    <Icon icon="solar:clock-circle-linear" className="w-4 h-4 mr-1" />
                    Quick Log +
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-border"
                    onClick={() => router.push(`/tasks/ticket/${focusTicket.id}`)}
                  >
                    <Icon icon="solar:arrow-right-linear" className="w-4 h-4 mr-1" />
                    View Ticket →
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Row 2: Weekly Stats + Up Next */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="border border-border bg-card p-6"
            >
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                [MY WEEK]
              </div>
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="currentColor"
                      className="text-muted/10"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="currentColor"
                      className="text-primary"
                      strokeWidth="2.5"
                      strokeDasharray={`${(weeklyHours / 40) * 100} 100`}
                      strokeLinecap="butt"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold">
                      {weeklyHours.toFixed(1)}h
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">/ 40h</span>
                  </div>
                </div>
              </div>
              <div className="text-center font-mono text-xs text-muted-foreground mb-4">
                Hours logged this week
              </div>
              <div className="flex items-end gap-2 justify-center h-16">
                {dailyHours.map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-8 transition-all',
                        h > 0 ? 'bg-primary' : 'bg-muted-foreground/10'
                      )}
                      style={{ height: `${Math.min(48, (h / 8) * 48)}px` }}
                    />
                    <span className="font-mono text-[10px] text-muted-foreground">{days[i]}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="border border-border bg-card p-6"
            >
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                [UP NEXT]
              </div>
              {upcomingTickets.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTickets.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => router.push(`/tasks/ticket/${t.id}`)}
                      className="flex items-center gap-3 p-3 border border-border bg-background hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className={cn('w-2 h-2 rounded-full', getPriorityColor(t.priority))} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{t.title}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          ID: {t.ticketId}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ~{t.estimatedHours}h
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-30">
                  <Icon
                    icon="solar:check-circle-linear"
                    className="w-8 h-8 text-primary mx-auto mb-2"
                  />
                  <p className="font-mono text-xs uppercase tracking-tighter">System Clear</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="border border-border bg-card p-6"
          >
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
              [LEADERBOARD]
            </div>
            <h3 className="font-display font-semibold text-lg mb-4">Top Contributors</h3>
            <div className="space-y-2">
              {leaderboard.map((entry, i) => {
                const isYou = entry.id === user?.id;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center gap-4 p-3 border',
                      isYou ? 'bg-primary/5 border-primary/30' : 'border-border bg-muted/5'
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-sm w-10',
                        i < 3 ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      #{i + 1} {medals[i] || ''}
                    </span>
                    <div className="w-7 h-7 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {entry.image ? (
                        <Image
                          src={entry.image}
                          alt=""
                          width={28}
                          height={28}
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Icon
                          icon="solar:user-linear"
                          className="w-3.5 h-3.5 text-muted-foreground"
                        />
                      )}
                    </div>
                    <span className="text-sm flex-1 truncate">
                      {isYou ? <span className="text-primary font-medium">You</span> : entry.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-muted-foreground uppercase">
                          Tickets
                        </div>
                        <div className="font-display font-bold text-xs">{entry.ticketsDone}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-muted-foreground uppercase">
                          Hours
                        </div>
                        <div className="font-display font-bold text-xs">{entry.hoursLogged}h</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Personal Activity Feed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border border-border bg-card p-6"
          >
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
              [PERSONAL_ACTIVITY_STREAM]
            </div>
            <div className="space-y-4">
              {activities?.map((a) => (
                <div
                  key={a.id}
                  onClick={() => a.ticketId && router.push(`/tasks/ticket/${a.ticketId}`)}
                  className="flex items-center gap-4 py-3 border-b border-border/50 group cursor-pointer hover:bg-muted/10 transition-colors px-2"
                >
                  <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                    <Icon
                      icon={
                        a.type === 'time-log'
                          ? 'solar:clock-circle-linear'
                          : a.type === 'completed'
                            ? 'solar:check-circle-linear'
                            : 'solar:document-text-linear'
                      }
                      className="w-4 h-4 text-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">
                      <span className="text-muted-foreground">{a.action}</span>{' '}
                      {a.ticketId && (
                        <span className="text-primary font-mono text-[10px] bg-primary/10 px-1">
                          {a.ticketId}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5 opacity-50">
                      {format(new Date(a.createdAt), 'HH:mm:ss')} • {a.type.toUpperCase()}
                    </div>
                  </div>
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <WeeklyGoals />

          <div className="border border-border bg-card p-6">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
              [SYSTEM_STATUS]
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs">Network Latency</span>
                <span className="font-mono text-[10px] text-primary">12ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Database Sync</span>
                <span className="font-mono text-[10px] text-primary">ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Encryption</span>
                <span className="font-mono text-[10px] text-primary">AES-256</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Log Dialog */}
      <Dialog open={showQuickLog} onOpenChange={setShowQuickLog}>
        <DialogContent className="bg-card border-border p-8 max-w-md rounded-none font-mono">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold tracking-tight uppercase mb-4">
              Quick Log Update
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest block">
                Resource Allocation (Hours)
              </label>
              <Input
                type="number"
                min="0.25"
                step="0.25"
                value={quickLogHours}
                onChange={(e) => setQuickLogHours(e.target.value)}
                className="bg-muted/30 border-border h-14 font-display text-4xl font-bold text-center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest block">
                Activity Manifest
              </label>
              <Textarea
                value={quickLogNote}
                onChange={(e) => setQuickLogNote(e.target.value)}
                placeholder="Describe the unit of work..."
                className="bg-muted/30 border-border min-h-[100px] text-xs"
              />
            </div>
            <Button
              className="w-full h-14 font-bold bg-primary text-background hover:bg-primary/90"
              onClick={handleQuickLog}
              disabled={!quickLogHours || parseFloat(quickLogHours) <= 0 || isLogging}
            >
              {isLogging ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin mr-2" />
                  SYNCING_VECTORS...
                </>
              ) : (
                'CONFIRM_LOG'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function DashboardPage() {
  const { orgRole } = useAuth();

  if (orgRole !== 'member') {
    return <AdminDashboardContent />;
  }

  return <MemberDashboardContent />;
}
