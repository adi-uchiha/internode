'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { startOfWeek, addDays, format } from 'date-fns';

import {
  getStatusColor,
  getStatusLabel,
  getTimeBarColor,
  getPriorityColor,
} from '@/lib/ticket-utils';

import { useTickets } from '@/hooks/useTickets';
import { useUsers } from '@/hooks/useUsers';
import { useTaskAnalytics } from '@/hooks/useAnalytics';
import { useActivities } from '@/hooks/useActivities';
import { useLogs } from '@/hooks/useLogs';
import { useLogTime } from '@/hooks/useTickets';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import Image from 'next/image';

const Sparkline = ({ data, color = 'hsl(140 100% 50%)' }: { data: number[]; color?: string }) => (
  <svg viewBox="0 0 70 20" className="w-full h-5">
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      points={data
        .map((v, i) => `${(i / (data.length - 1)) * 70},${20 - (v / Math.max(...data)) * 18}`)
        .join(' ')}
    />
  </svg>
);

// Admin Dashboard
const AdminDashboardContent = () => {
  const router = useRouter();
  const { data: analytics, isLoading: analyticsLoading } = useTaskAnalytics();
  const { data: activities, isLoading: activitiesLoading } = useActivities({ limit: 10 });
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: users } = useUsers();

  // Dashboard loading state

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
      value: analytics?.kpis.totalTickets || 0,
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
      sparkData: analytics?.trends?.completion?.map((v: number) => 100 - v) || [
        0, 0, 0, 0, 0, 0, 0,
      ],
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
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`border bg-card p-5 ${
              kpi.danger ? 'border-l-[3px] border-l-destructive border-border' : 'border-border'
            }`}
          >
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              {kpi.label}
            </div>
            <div className="font-display text-4xl font-bold mb-1">{kpi.value}</div>
            <div className={`text-xs ${kpi.subColor}`}>{kpi.sub}</div>
            <div className="mt-3">
              <Sparkline data={kpi.sparkData} color={kpi.danger ? '#ef4444' : undefined} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Burn Rate + Red Flag Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 border border-border bg-card p-6"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            [BURN RATE]
          </div>
          <h3 className="font-display font-semibold text-lg mb-4">Estimated vs. Actual Hours</h3>
          <div className="flex gap-2 mb-4">
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
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.burnRate || []}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(140 100% 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(140 100% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#666', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#1e1e1e' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#1e1e1e' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#222',
                    border: '1px solid #2a2a2a',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="estimated"
                  stroke="#666"
                  strokeDasharray="5 5"
                  fill="none"
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(140 100% 50%)"
                  fill="url(#actualGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 border border-border bg-card p-6"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            [ALERTS]
          </div>
          <h3 className="font-display font-semibold text-lg mb-4">Over-Budget Tickets</h3>
          {overBudgetTickets.length > 0 ? (
            <div className="space-y-3">
              {overBudgetTickets.map((t) => {
                const variance = Math.round(
                  ((t.loggedHours - t.estimatedHours) / t.estimatedHours) * 100
                );
                const member = users?.find((u) => u.id === t.assigneeId);
                return (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/tasks/ticket/${t.id}`)}
                    className="flex items-center gap-3 p-3 border border-border bg-background cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{t.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-destructive bg-destructive/15 px-1.5 py-0.5">
                          +{variance}%
                        </span>
                        <div className="flex-1 h-1 bg-muted overflow-hidden">
                          <div
                            className="h-full bg-destructive"
                            style={{
                              width: `${Math.min(150, (t.loggedHours / t.estimatedHours) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {member?.image ? (
                        <Image
                          src={member.image}
                          alt=""
                          width={24}
                          height={24}
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Icon icon="solar:user-linear" className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon
                icon="solar:check-circle-linear"
                className="w-8 h-8 text-primary mx-auto mb-2"
              />
              <p className="font-mono text-xs text-muted-foreground">No over-budget tickets</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 3: Project Hours + Team Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-border bg-card p-6"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            [PROJECTS]
          </div>
          <h3 className="font-display font-semibold text-lg mb-4">Time by Project</h3>
          <div className="space-y-4">
            {analytics?.projectHours.map((p) => {
              const overBudget = p.actual > p.estimated;
              return (
                <div key={p.project} className="flex items-center gap-3">
                  <span className="text-sm w-28 truncate">{p.project}</span>
                  <div className="flex-1 h-4 bg-muted relative overflow-hidden">
                    <div
                      className="absolute inset-0 border border-border/50"
                      style={{ width: `${p.estimated > 0 ? (p.estimated / 40) * 100 : 0}%` }}
                    />
                    <div
                      className={`h-full ${overBudget ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${p.actual > 0 ? (p.actual / 40) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground w-16 text-right">
                    {p.actual}/{p.estimated}h
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="border border-border bg-card p-6"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            [TEAM STATUS]
          </div>
          <h3 className="font-display font-semibold text-lg mb-4">Live Member Activity</h3>
          <div className="space-y-1">
            {users?.slice(0, 5).map((member, i) => {
              const activeTicket = tickets?.find(
                (t) => t.assigneeId === member.id && t.status === 'in-progress'
              );
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    i % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                  }`}
                  onClick={() => activeTicket && router.push(`/tasks/ticket/${activeTicket.id}`)}
                >
                  <div className="w-7 h-7 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {member.image ? (
                      <Image
                        src={member.image}
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
                  <span className="text-sm flex-1 truncate">{member.name}</span>
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                    {activeTicket?.title || '—'}
                  </span>
                  {activeTicket && (
                    <span
                      className={`font-mono text-[10px] uppercase px-1.5 py-0.5 ${getStatusColor(
                        activeTicket.status
                      )}`}
                    >
                      {getStatusLabel(activeTicket.status)}
                    </span>
                  )}
                  <span className="font-mono text-xs text-right w-12 text-muted-foreground">
                    active
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Row 4: Activity Feed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="border border-border bg-card p-6"
      >
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
          [ACTIVITY LOG]
        </div>
        <h3 className="font-display font-semibold text-lg mb-4">Recent Activity</h3>
        <div className="flex gap-2 mb-4">
          {[
            { value: 'all', label: 'All' },
            { value: 'time-logs', label: 'Time Logs' },
            { value: 'status', label: 'Status Changes' },
            { value: 'comments', label: 'Comments' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setActivityFilter(f.value)}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                activityFilter === f.value
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {activities?.map((a) => {
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 pl-8 relative p-2 transition-colors border-b border-border/10 last:border-0"
                >
                  <div className="absolute left-[13px] w-[5px] h-[5px] bg-border rounded-full" />
                  <div className="w-6 h-6 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {a.user?.image ? (
                      <Image
                        src={a.user.image}
                        alt=""
                        width={24}
                        height={24}
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Icon icon="solar:user-linear" className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm">
                    <span className="font-medium">{a.user?.name}</span> {a.action}{' '}
                    {a.ticketId && (
                      <span className="text-primary font-mono text-[10px]">
                        [{a.ticketId.slice(0, 8)}]
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground ml-auto shrink-0">
                    {new Date(a.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Member Dashboard
const MemberDashboardContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: logs } = useLogs();
  const { data: activities } = useActivities({ userId: user?.id, limit: 10 });
  const { data: users } = useUsers();

  const focusTicket = tickets?.find((t) => t.status === 'in-progress' && t.assigneeId === user?.id);
  const upcomingTickets =
    tickets?.filter((t) => t.status === 'todo' && t.assigneeId === user?.id) || [];

  // Weekly stats calculation from real logs
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyLogs = logs?.filter((l) => new Date(l.date) >= startOfCurrentWeek) || [];
  const weeklyHours = weeklyLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

  const dailyHours = [0, 0, 0, 0, 0].map((_, i) => {
    const date = format(addDays(startOfCurrentWeek, i), 'yyyy-MM-dd');
    return weeklyLogs
      .filter((l) => format(new Date(l.date), 'yyyy-MM-dd') === date)
      .reduce((sum, l) => sum + (l.hours || 0), 0);
  });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Leaderboard calculation (Simplified for now: count of done tickets in last 7 days)
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
      .sort(
        (a: { ticketsDone: number }, b: { ticketsDone: number }) => b.ticketsDone - a.ticketsDone
      )
      .slice(0, 5);
  }, [users, tickets]);

  // Quick Log state
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogHours, setQuickLogHours] = useState('');
  const [quickLogNote, setQuickLogNote] = useState('');
  const { mutateAsync: logTime, isPending: isLogging } = useLogTime();

  const handleQuickLog = async () => {
    if (!quickLogHours || parseFloat(quickLogHours) <= 0 || !focusTicket) return;
    try {
      await logTime({
        id: focusTicket.id,
        hours: parseFloat(quickLogHours),
        note: quickLogNote,
        date: new Date().toISOString(),
      });
      toast.success(`Logged ${quickLogHours}h on "${focusTicket.title}"`);
      setShowQuickLog(false);
      setQuickLogHours('');
      setQuickLogNote('');
    } catch (err: unknown) {
      console.error('ERROR_SYNCING_LOG_VECTORS:', err);
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
    <div className="space-y-6">
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
                className={`w-2.5 h-2.5 rounded-full ${getTimeBarColor(
                  focusTicket.loggedHours,
                  focusTicket.estimatedHours
                )}`}
              />
              <span className="font-display font-semibold flex-1">{focusTicket.title}</span>
              <span
                className={`font-mono text-[10px] uppercase px-2 py-0.5 ${getStatusColor(
                  focusTicket.status
                )}`}
              >
                {getStatusLabel(focusTicket.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs text-muted-foreground">
                Ticket ID: {focusTicket.ticketId}
              </span>
              <span className="text-muted-foreground">·</span>
              <div className={`w-2 h-2 rounded-full ${getPriorityColor(focusTicket.priority)}`} />
              <span className="font-mono text-xs capitalize">{focusTicket.priority}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted overflow-hidden">
                <div
                  className={`h-full ${getTimeBarColor(
                    focusTicket.loggedHours,
                    focusTicket.estimatedHours
                  )}`}
                  style={{
                    width: `${Math.min(
                      100,
                      (focusTicket.loggedHours / focusTicket.estimatedHours) * 100
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
                variant="hero"
                size="sm"
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
                  stroke="hsl(0 0% 10%)"
                  strokeWidth="2.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="hsl(140 100% 50%)"
                  strokeWidth="2.5"
                  strokeDasharray={`${(32.5 / 40) * 100} 100`}
                  strokeLinecap="butt"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold">{weeklyHours.toFixed(1)}h</span>
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
                  className={`w-8 ${i === 3 ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  style={{ height: `${(h / 8) * 48}px` }}
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
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(t.priority)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.title}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      ID: {t.ticketId}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ~{t.estimatedHours}h
                  </span>
                  {t.dueDate && (
                    <span className="font-mono text-[10px] text-amber-400">
                      Due {new Date(t.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon
                icon="solar:check-circle-linear"
                className="w-8 h-8 text-primary mx-auto mb-2"
              />
              <p className="font-mono text-xs text-muted-foreground">
                All clear! No pending tickets.
              </p>
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
        <h3 className="font-display font-semibold text-lg mb-4">Top Contributors This Week</h3>
        <div className="flex gap-2 mb-4">
          {['By Tickets', 'By Hours', 'By Efficiency'].map((f, i) => (
            <button
              key={f}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                i === 0 ? 'border-primary text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {leaderboard.map((entry, i) => {
            const isYou = entry.id === user?.id;
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-3 ${
                  isYou ? 'bg-primary/10 border border-primary/30' : 'border border-border'
                }`}
              >
                <span
                  className={`font-mono text-sm w-8 ${
                    i < 3 ? 'text-primary' : 'text-muted-foreground'
                  }`}
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
                    <Icon icon="solar:user-linear" className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm flex-1">
                  {isYou ? <span className="text-primary font-medium">You</span> : entry.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {entry.ticketsDone} tickets done
                </span>
                <span className="text-muted-foreground">│</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {entry.hoursLogged}h logged
                </span>
                <span className="text-muted-foreground">│</span>
                <span
                  className={`font-mono text-xs ${
                    entry.efficiency >= 95
                      ? 'text-primary'
                      : entry.efficiency >= 80
                        ? 'text-amber-400'
                        : 'text-destructive'
                  }`}
                >
                  Efficiency: {entry.efficiency}%
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Personal Activity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="border border-border bg-card p-6"
      >
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
          [RECENT ACTIVITY]
        </div>
        <div className="space-y-3">
          {activities?.map((a) => (
            <div
              key={a.id}
              onClick={() => a.ticketId && router.push(`/tasks/ticket/${a.ticketId}`)}
              className="flex items-center gap-3 p-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <Icon
                icon={
                  a.type === 'time-log'
                    ? 'solar:clock-circle-linear'
                    : a.type === 'completed'
                      ? 'solar:check-circle-linear'
                      : 'solar:document-text-linear'
                }
                className="w-4 h-4 text-muted-foreground"
              />
              <span className="text-sm flex-1">
                {a.action}{' '}
                {a.ticketId && (
                  <span className="text-primary font-mono text-[10px]">
                    [{a.ticketId.slice(0, 8)}]
                  </span>
                )}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(a.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Log Dialog */}
      <Dialog open={showQuickLog} onOpenChange={setShowQuickLog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Quick Log — {focusTicket?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Hours
              </label>
              <Input
                type="number"
                min="0.25"
                step="0.25"
                value={quickLogHours}
                onChange={(e) => setQuickLogHours(e.target.value)}
                placeholder="2.0"
                className="bg-muted border-border"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Note
              </label>
              <Textarea
                value={quickLogNote}
                onChange={(e) => setQuickLogNote(e.target.value)}
                placeholder="What did you work on?"
                className="bg-muted border-border font-mono text-sm min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowQuickLog(false)}>
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleQuickLog}
                disabled={!quickLogHours || parseFloat(quickLogHours) <= 0 || isLogging}
              >
                {isLogging ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin mr-2" />
                    LOGGING...
                  </>
                ) : (
                  'Log Time'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function TaskDashboardPage() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  return (
    <div className="w-full">{isAdmin ? <AdminDashboardContent /> : <MemberDashboardContent />}</div>
  );
}
