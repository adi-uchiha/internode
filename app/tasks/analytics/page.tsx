'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useTaskAnalytics } from '@/hooks/useAnalytics';
import { useUsers } from '@/hooks/useUsers';
import { useTickets, type TicketWithRelations } from '@/hooks/useTickets';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

const Sparkline = ({ data, color = 'hsl(140 100% 50%)' }: { data: number[]; color?: string }) => (
  <svg viewBox="0 0 50 16" className="w-12 h-4">
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      points={data
        .map((v, i) => `${(i / (data.length - 1)) * 50},${16 - (v / Math.max(...data, 1)) * 14}`)
        .join(' ')}
    />
  </svg>
);

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('This Week');
  const [selectedMember, setSelectedMember] = useState('');

  const { data: analytics, isLoading: analyticsLoading } = useTaskAnalytics();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: tickets, isLoading: ticketsLoading } = useTickets() as {
    data: TicketWithRelations[] | undefined;
    isLoading: boolean;
  };

  const isLoading = analyticsLoading || usersLoading || ticketsLoading;

  // Status flow data from API
  const statusFlowData = analytics?.statusFlow || [];

  const pieData =
    analytics?.projectHours.map((p) => ({
      name: p.project,
      value: p.actual,
      color: p.color,
    })) || [];

  // Member ranking calculation from real data
  const memberRanking = useMemo(() => {
    if (!users || !tickets) return [];
    return users
      .filter((u) => u.role === 'member')
      .map((u) => {
        const userTickets = tickets.filter((t) => t.assigneeId === u.id);
        const doneTicketsCount = userTickets.filter((t) => t.status === 'done').length;
        const totalLoggedHours = userTickets.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
        const estHours = userTickets.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        const efficiency =
          estHours > 0 ? Math.min(100, Math.round((totalLoggedHours / estHours) * 100)) : 0;

        // Calculate real trend (last 7 days of logs)
        const trend = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(startOfDay(new Date()), 6 - i);
          return userTickets.reduce((sum, t) => {
            const dayLogs = t.timeLogs?.filter((l) => isSameDay(new Date(l.date), date)) || [];
            return sum + dayLogs.reduce((s, l) => s + l.hours, 0);
          }, 0);
        });

        return {
          rank: 0, // Will be set after sort
          member: u,
          ticketsDone: doneTicketsCount,
          hoursLogged: totalLoggedHours.toFixed(1),
          efficiency,
          trend,
        };
      })
      .sort((a, b) => b.ticketsDone - a.ticketsDone)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [users, tickets]);

  // Individual deep dive
  const selectedUserData = users?.find((u) => u.id === selectedMember);

  const memberBarData = useMemo(() => {
    if (!selectedMember || !tickets) return [];

    return Array.from({ length: 14 }, (_, i) => {
      const date = subDays(startOfDay(new Date()), 13 - i);
      const dayHours = tickets.reduce((sum, t) => {
        const dayLogs =
          t.timeLogs?.filter(
            (l) => l.userId === selectedMember && isSameDay(new Date(l.date), date)
          ) || [];
        return sum + dayLogs.reduce((s, l) => s + l.hours, 0);
      }, 0);

      return {
        day: format(date, 'MMM dd'),
        hours: dayHours,
      };
    });
  }, [selectedMember, tickets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-sm text-muted-foreground">
        <Icon icon="solar:refresh-linear" className="w-5 h-5 animate-spin mr-2" />
        INITIALIZING_ANALYTICS_ENGINE...
      </div>
    );
  }

  const kpis = analytics?.kpis || {
    totalTickets: 0,
    completedTickets: 0,
    totalHours: 0,
    overdue: 0,
    avgVelocity: 0,
    teamHours: '0',
    inProgress: 0,
  };
  const efficiency =
    kpis.totalTickets > 0 ? Math.round((kpis.completedTickets / kpis.totalTickets) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex justify-end">
        <div className="flex gap-1 bg-card/50 p-1 border border-border">
          {['This Week', 'Last 2 Weeks', 'This Month', 'Custom Range'].map((r) => (
            <button
              key={r}
              className={cn(
                'font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-all',
                dateRange === r
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setDateRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Productivity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-card p-6 shadow-sm group hover:border-primary/30 transition-colors"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            Team Velocity
          </div>
          <div className="font-display text-4xl font-bold mb-2 text-foreground">
            {kpis.completedTickets}
          </div>
          <div className="text-xs text-primary mb-3 flex items-center gap-1 font-mono">
            <Icon icon="solar:round-alt-arrow-up-linear" className="w-3 h-3" />+
            {Number(analytics?.kpis?.avgVelocity || 0).toFixed(0)} avg/week
          </div>
          <Sparkline data={analytics?.trends?.completion || [2, 4, 3, 5, 4, 6, 8]} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-border bg-card p-6 shadow-sm group hover:border-primary/30 transition-colors"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            Average Efficiency
          </div>
          <div className="flex justify-center my-4">
            <div className="relative w-24 h-12">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  strokeLinecap="butt"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="butt"
                  strokeDasharray={`${(efficiency / 100) * 125.6} 125.6`}
                />
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-display text-2xl font-bold">
                {efficiency}%
              </div>
            </div>
          </div>
          <div className="font-mono text-[10px] text-center text-muted-foreground mt-2 opacity-50">
            Est / Actual × 100
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-border bg-card p-6 shadow-sm group hover:border-primary/30 transition-colors"
        >
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            Total Hours Logged
          </div>
          <div className="font-display text-4xl font-bold mb-3 text-foreground">
            {parseFloat(kpis.teamHours).toFixed(1)}h
          </div>
          <div className="h-4 bg-muted flex overflow-hidden rounded-sm ring-1 ring-border">
            {analytics?.projectHours.map((p) => (
              <div
                key={p.project}
                className="h-full transition-all duration-500"
                style={{
                  width: `${(p.actual / (kpis.totalHours || 1)) * 100}%`,
                  backgroundColor: p.color,
                }}
                title={p.project}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {analytics?.projectHours.map((p) => (
              <div key={p.project} className="flex items-center gap-1.5 mr-2">
                <div className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: p.color }} />
                <span className="font-mono text-[9px] text-muted-foreground font-bold">
                  {p.project.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 2: Member Comparison Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border border-border bg-card shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-display font-semibold text-sm tracking-tight">
            Member Performance Leaderboard
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/5">
                {[
                  'Rank',
                  'Member',
                  'Tickets Done',
                  'Hours Logged',
                  'Avg Efficiency',
                  'Trending',
                ].map((h) => (
                  <th
                    key={h}
                    className="p-4 font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberRanking.map((row, i) => (
                <tr
                  key={row.member.id}
                  className="border-b border-border/30 hover:bg-muted/10 transition-colors group"
                >
                  <td
                    className={cn(
                      'p-4 font-mono text-sm',
                      i < 3 ? 'text-primary font-bold' : 'text-muted-foreground'
                    )}
                  >
                    #{row.rank}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center group-hover:border-primary/50 transition-colors">
                        {row.member.image ? (
                          <Image
                            src={row.member.image}
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
                      <span className="text-sm font-medium">{row.member.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm font-medium">{row.ticketsDone}</td>
                  <td className="p-4 font-mono text-sm font-bold">{row.hoursLogged}h</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'font-mono text-sm font-bold',
                        row.efficiency >= 85
                          ? 'text-primary'
                          : row.efficiency >= 60
                            ? 'text-amber-400'
                            : 'text-destructive'
                      )}
                    >
                      {row.efficiency}%
                    </span>
                  </td>
                  <td className="p-4">
                    <Sparkline data={row.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border border-border bg-card p-6 shadow-sm"
        >
          <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
            <Icon icon="solar:graph-up-linear" className="w-5 h-5 text-primary" />
            Ticket Flow Velocity
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusFlowData}>
              <XAxis
                dataKey="week"
                tick={{ fill: '#666', fontSize: 11 }}
                axisLine={{ stroke: '#1e1e1e' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#666', fontSize: 11 }}
                axisLine={{ stroke: '#1e1e1e' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                  fontSize: 12,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              />
              <Bar dataKey="todo" stackId="a" fill="hsl(var(--muted-foreground)/0.3)" />
              <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" />
              <Bar dataKey="inReview" stackId="a" fill="#f59e0b" />
              <Bar dataKey="done" stackId="a" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-border bg-card p-6 shadow-sm flex flex-col"
        >
          <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
            <Icon icon="solar:pie-chart-2-linear" className="w-5 h-5 text-primary" />
            Time Allocation Breakdown
          </h3>
          <div className="flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  fill="white"
                  className="font-display text-3xl font-bold"
                >
                  {parseFloat(kpis.teamHours).toFixed(0)}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  fill="#666"
                  className="font-mono text-xs font-bold uppercase tracking-widest"
                >
                  Hours
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border/50">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                    {p.name.split(' ')[0]}
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold">
                  {kpis.totalHours > 0 ? Math.round((p.value / kpis.totalHours) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 4: Individual Deep Dive */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="border border-border bg-card p-8 shadow-xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">
              Individual Performance Deep-Dive
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-1 opacity-60 uppercase tracking-widest">
              Granular Resource Analytics
            </p>
          </div>
          <Select value={selectedMember} onValueChange={(val) => setSelectedMember(val || '')}>
            <SelectTrigger className="w-full md:w-[240px] bg-muted/30 border-border h-10 font-mono text-xs">
              <SelectValue placeholder="Select member for analysis" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-2xl">
              {users
                ?.filter((m) => m.role === 'member')
                .map((m) => (
                  <SelectItem key={m.id} value={m.id} className="cursor-pointer">
                    {m.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserData ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="font-mono text-[10px] text-muted-foreground uppercase mb-6 tracking-widest opacity-50 flex items-center gap-2">
                <div className="w-8 h-px bg-border" />
                Hourly Burn Rate (Last 14 Intervals)
                <div className="flex-1 h-px bg-border" />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={memberBarData}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#666', fontSize: 9 }}
                    axisLine={{ stroke: '#1e1e1e' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#666', fontSize: 9 }}
                    axisLine={{ stroke: '#1e1e1e' }}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 255, 136, 0.05)' }}
                    contentStyle={{
                      backgroundColor: '#000',
                      border: '1px solid #1a1a1a',
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2 space-y-4 flex flex-col justify-center">
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 opacity-50">
                Operational KPIs
              </div>
              {[
                {
                  label: 'System Efficiency',
                  value: `${memberRanking.find((r) => r.member.id === selectedMember)?.efficiency || 0}%`,
                  icon: 'solar:bolt-circle-linear',
                  color: 'text-primary',
                },
                {
                  label: 'Weekly Bandwidth',
                  value: `${memberRanking.find((r) => r.member.id === selectedMember)?.hoursLogged || 0}h / 40h`,
                  icon: 'solar:watch-square-linear',
                  color: 'text-blue-500',
                },
                {
                  label: 'Queue Capacity',
                  value: `${tickets?.filter((t) => t.assigneeId === selectedMember && t.status !== 'done').length || 0} Active`,
                  icon: 'solar:clipboard-list-linear',
                  color: 'text-amber-500',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between p-4 border border-border bg-muted/10 group/item hover:bg-muted/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Icon icon={s.icon} className={cn('w-5 h-5', s.color)} />
                    <span className="font-mono text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/5 border border-dashed border-border rounded-lg">
            <Icon
              icon="solar:chart-square-linear"
              className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20"
            />
            <p className="font-mono text-sm text-muted-foreground">
              Awaiting member selection for diagnostic analysis
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
