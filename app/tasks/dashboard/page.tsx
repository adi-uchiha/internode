'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

import { getPriorityColor } from '@/lib/ticket-utils';

import { useTickets, useLogTime, type TicketWithRelations } from '@/hooks/useTickets';
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

// Main Dashboard Component
export default function DashboardPage() {
  const { data: tickets } = useTickets();
  const { orgRole } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null);
  const [logTimeModal, setLogTimeModal] = useState(false);
  const [logValue, setLogValue] = useState('1');
  const [logNote, setLogNote] = useState('');
  const { mutateAsync: logTime } = useLogTime();

  const handleLogTime = async () => {
    if (!selectedTicket || !logValue) return;
    try {
      await logTime({
        id: selectedTicket.id,
        hours: parseFloat(logValue),
        note: logNote || 'Manual progress log',
        date: new Date().toISOString(),
      });
      toast.success('Resource logged successfully');
      setLogTimeModal(false);
      setLogValue('1');
      setLogNote('');
    } catch {
      toast.error('Failed to log resource');
    }
  };

  const tasksByStatus = useMemo(() => {
    if (!tickets)
      return {
        'in-progress': [] as TicketWithRelations[],
        'in-review': [] as TicketWithRelations[],
        todo: [] as TicketWithRelations[],
      };
    return {
      'in-progress': tickets.filter((t) => t.status === 'in-progress'),
      'in-review': tickets.filter((t) => t.status === 'in-review'),
      todo: tickets.filter((t) => t.status === 'todo'),
    };
  }, [tickets]);

  if (orgRole !== 'member') {
    return <AdminDashboardContent />;
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
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              IN_PROGRESS_VECTOR
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasksByStatus['in-progress']?.length > 0 ? (
                tasksByStatus['in-progress'].map((task: TicketWithRelations) => (
                  <motion.div
                    key={task.id}
                    onClick={() => setSelectedTicket(task)}
                    className="group border border-border bg-card p-6 shadow-sm hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                        {task.ticketId}
                      </span>
                      <div className={`w-1 h-3 ${getPriorityColor(task.priority)}`} />
                    </div>
                    <h4 className="font-display font-bold text-lg leading-tight mb-4 group-hover:text-blue-500 transition-colors">
                      {task.title}
                    </h4>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:clock-circle-linear"
                          className="w-3.5 h-3.5 text-muted-foreground"
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {task.loggedHours}/{task.estimatedHours}h
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 font-mono text-[10px] border border-border"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(task);
                          setLogTimeModal(true);
                        }}
                      >
                        LOG_RES
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 py-12 border border-dashed border-border flex flex-col items-center justify-center opacity-40">
                  <p className="font-mono text-[10px] uppercase">No active vectors found</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Waiting_Validation
              </h3>
              <div className="space-y-3">
                {tasksByStatus['in-review']?.map((task: TicketWithRelations) => (
                  <div
                    key={task.id}
                    className="p-4 border border-border bg-card/50 hover:border-amber-500/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTicket(task)}
                  >
                    <div className="font-medium text-sm truncate uppercase tracking-tight">
                      {task.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                Pending_Deployment
              </h3>
              <div className="space-y-3">
                {tasksByStatus['todo']?.slice(0, 4).map((task: TicketWithRelations) => (
                  <div
                    key={task.id}
                    className="p-4 border border-border bg-card/50 hover:border-primary/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTicket(task)}
                  >
                    <div className="font-medium text-sm truncate uppercase tracking-tight">
                      {task.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <WeeklyGoals />
        </div>
      </div>

      <Dialog open={logTimeModal} onOpenChange={setLogTimeModal}>
        <DialogContent className="bg-card border-border shadow-2xl font-mono p-8 max-w-md rounded-none">
          <DialogTitle className="font-display text-2xl font-bold tracking-tight uppercase mb-8">
            {selectedTicket?.ticketId} Update
          </DialogTitle>
          <div className="space-y-8">
            <Input
              type="number"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              className="bg-muted/30 border-border h-14 font-display text-4xl font-bold text-center"
            />
            <Textarea
              placeholder="Brief summary of activities..."
              className="bg-muted/30 border-border min-h-[100px] text-xs"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
            />
            <Button className="w-full h-14 font-bold bg-primary text-black" onClick={handleLogTime}>
              Confirm_Allocation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
