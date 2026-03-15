'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useTaskAnalytics } from '@/hooks/useAnalytics';
import { useUsers } from '@/hooks/useUsers';
import { useTickets } from '@/hooks/useTickets';
import { format } from 'date-fns';
import Image from 'next/image';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Sparkline = ({ data, color = 'hsl(140 100% 50%)' }: { data: number[]; color?: string }) => (
  <svg viewBox="0 0 50 16" className="w-12 h-4">
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
      points={data
        .map((v, i) => `${(i / (data.length - 1)) * 50},${16 - (v / Math.max(...data, 1)) * 14}`)
        .join(' ')}
    />
  </svg>
);

export default function AnalyticsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useTaskAnalytics();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: tickets } = useTickets();
  const [selectedMember, setSelectedMember] = useState<string>('');

  if (analyticsLoading || usersLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-card border border-border" />
        ))}
      </div>
    );
  }

  const kpis = analytics?.kpis || {
    ticketsTotal: 0,
    completionRate: 0,
    highPriority: 0,
    totalHours: 0,
    activeContributors: 0,
  };

  const pieData = [
    { name: 'Architecture', value: 45, color: 'hsl(var(--primary))' },
    { name: 'Feature Dev', value: 30, color: '#3b82f6' },
    { name: 'Bug Resolution', value: 15, color: '#ef4444' },
    { name: 'Optimization', value: 10, color: '#f59e0b' },
  ];

  const selectedUserInfo = users?.find((u) => u.id === selectedMember);

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto py-10">
      {/* Header with System Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary font-bold">
              System Intelligence Active
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tighter">CORE_ANALYTICS</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest max-w-md opacity-70">
            Real-time heuristic processing of organizational vectors and resource throughput.
          </p>
        </div>
        <div className="flex gap-4 border-l border-border pl-6 h-12 items-center">
          <div className="text-right">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Network Load</p>
            <p className="font-mono text-sm font-bold">OPTIMAL_2.4ms</p>
          </div>
          <div className="w-px h-8 bg-border/50" />
          <div className="text-right">
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Last Sync</p>
            <p className="font-mono text-sm font-bold uppercase">
              {format(new Date(), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Throughput',
            value: `${kpis.ticketsTotal} Units`,
            detail: 'Units processed (30d)',
            trend: [4, 6, 8, 5, 9, 7],
            icon: 'solar:bolt-linear',
          },
          {
            label: 'Efficiency',
            value: `${Math.round(kpis.completionRate)}%`,
            detail: 'System closure rate',
            trend: [80, 85, 82, 88, 92, 90],
            icon: 'solar:graph-up-linear',
          },
          {
            label: 'Capacity',
            value: `${kpis.activeContributors} Active`,
            detail: 'Concurrent contributors',
            trend: [12, 14, 13, 15, 12, 16],
            icon: 'solar:users-group-two-rounded-linear',
          },
          {
            label: 'Integrity',
            value: kpis.highPriority,
            detail: 'High priority alerts',
            trend: [2, 1, 3, 0, 1, 2],
            icon: 'solar:shield-check-linear',
            alert: kpis.highPriority > 5,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'group relative bg-card border border-border p-6 shadow-sm overflow-hidden hover:border-primary/50 transition-all',
              kpi.alert && 'border-destructive/30 bg-destructive/5'
            )}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Icon icon={kpi.icon} className="w-16 h-16" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  {kpi.label}
                </span>
                <Sparkline
                  data={kpi.trend}
                  color={kpi.alert ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-3xl font-bold tracking-tight">{kpi.value}</h3>
                <p className="font-mono text-[10px] text-muted-foreground uppercase opacity-60 italic">
                  {kpi.detail}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 border border-border bg-card p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-display text-xl font-bold tracking-tight">
                System Throughput Timeline
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-widest opacity-60">
                Created vs Resolved Vector Progression
              </p>
            </div>
            <div className="flex gap-6 font-mono text-[10px] uppercase">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/20 border border-primary/40" />
                <span>Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500/20 border border-blue-500/40" />
                <span>Created</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={analytics?.weeklyTrends}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border)/0.3)"
              />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0px',
                  padding: '12px',
                }}
                itemStyle={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                }}
                labelStyle={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-border bg-card p-8 shadow-sm flex flex-col"
        >
          <h3 className="font-display text-xl font-bold tracking-tight mb-2">Project Saturation</h3>
          <p className="text-xs text-muted-foreground font-mono mb-10 uppercase tracking-widest opacity-60">
            Vector density by deployment unit
          </p>
          <div className="space-y-8 flex-1">
            {analytics?.projects.slice(0, 5).map((p, i) => (
              <div key={p.name} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                      Unit_{i + 1}
                    </span>
                    <h4 className="font-display font-bold text-sm tracking-tight">{p.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] font-bold">{p.tickets} Vectors</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted/30 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.tickets / (kpis.ticketsTotal || 1)) * 100}%` }}
                    className="absolute inset-0 bg-primary shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 pt-6 border-t border-border flex items-center justify-between group">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
              Execute full Project audit
            </span>
            <Icon
              icon="solar:arrow-right-linear"
              className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all"
            />
          </button>
        </motion.div>
      </div>

      {/* Row 3: Status & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 border border-border bg-card p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-display text-xl font-bold tracking-tight">
                Status Vector Distribution
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-widest opacity-60">
                Weekly transition state mapping
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.statusFlow}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border)/0.3)"
              />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0px',
                  padding: '12px',
                }}
                itemStyle={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                }}
              />
              <Bar dataKey="done" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inReview" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar
                dataKey="todo"
                stackId="a"
                fill="hsl(var(--muted-foreground)/0.3)"
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="border border-border bg-card p-8 shadow-sm flex flex-col"
        >
          <h3 className="font-display text-xl font-bold tracking-tight mb-2">
            Resource Allocation
          </h3>
          <p className="text-xs text-muted-foreground font-mono mb-10 uppercase tracking-widest opacity-60">
            Current operational focus profile
          </p>
          <div className="flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={2000}
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0px',
                    padding: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/50">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] text-muted-foreground uppercase">
                    {p.name}
                  </span>
                  <span className="font-mono text-xs font-bold">{p.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 4: Individual Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="border border-border bg-card p-10 shadow-2xl relative group overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 group-hover:bg-primary/10 transition-all duration-700" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-1">
            <h2 className="font-display text-3xl font-bold tracking-tight uppercase">
              Operational Deep_Dive
            </h2>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest opacity-60 italic">
              Individual Contribution Matrix & Real-time KPI Mapping
            </p>
          </div>
          <Select value={selectedMember} onValueChange={(val) => setSelectedMember(val || '')}>
            <SelectTrigger className="w-full md:w-[320px] bg-muted/20 border-border h-12 font-mono text-xs focus:ring-primary/20">
              <SelectValue placeholder="Analyze individual contributor..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-2xl">
              {users
                ?.filter((u) => u.role === 'member')
                .map((user) => (
                  <SelectItem key={user.id} value={user.id} className="font-mono text-xs">
                    {user.name.toUpperCase()}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-8">
            <div className="p-6 bg-muted/20 border border-border/50 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-sm border border-border p-1 bg-card">
                  {selectedMember && selectedUserInfo ? (
                    <Image
                      src={selectedUserInfo.image || ''}
                      alt=""
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Icon icon="solar:user-circle-linear" className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg uppercase tracking-tight">
                    {selectedMember && selectedUserInfo ? selectedUserInfo.name : 'N/A_NODE'}
                  </h4>
                  <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">
                    Alpha Contributor
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="font-mono text-[9px] text-muted-foreground uppercase">
                    Stability Score
                  </p>
                  <p className="font-display font-bold text-xl uppercase tracking-tighter">98.2%</p>
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-[9px] text-muted-foreground uppercase">
                    Response Velocity
                  </p>
                  <p className="font-display font-bold text-xl uppercase tracking-tighter">Fast</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
                Contribution Indices
              </h5>
              {[
                { label: 'Signal Output', value: 'High', color: 'primary' },
                { label: 'Code Resilience', value: '94/100', color: 'blue-500' },
                { label: 'Collaborative Sync', value: 'Optimal', color: 'amber-500' },
              ].map((idx) => (
                <div
                  key={idx.label}
                  className="flex items-center justify-between p-4 border border-border/30 bg-card/40"
                >
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {idx.label}
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase">{idx.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border bg-muted/10 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:history-linear" className="w-4 h-4 text-primary" />
                  <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold">
                    Current Vector Focus
                  </h5>
                </div>
                <div className="space-y-3">
                  {tickets
                    ?.filter((t) => t.assigneeId === selectedMember && t.status !== 'done')
                    .slice(0, 3)
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between group">
                        <span className="font-mono text-[10px] truncate max-w-[180px] group-hover:text-primary transition-colors italic">
                          "{t.title}"
                        </span>
                        <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  {(!selectedMember ||
                    tickets?.filter((t) => t.assigneeId === selectedMember && t.status !== 'done')
                      .length === 0) && (
                    <p className="font-mono text-[10px] text-muted-foreground italic opacity-60">
                      No active operational vectors found.
                    </p>
                  )}
                </div>
              </div>

              <div className="border border-border bg-muted/10 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:cup-first-linear" className="w-4 h-4 text-primary" />
                  <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold">
                    System Breakthroughs
                  </h5>
                </div>
                <div className="space-y-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  <p className="font-mono text-[10px] uppercase tracking-tight">
                    Total Achievements: 12
                  </p>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 border border-primary/20 bg-primary/5 flex items-center justify-center"
                      >
                        <Icon icon="solar:medal-star-bold" className="w-4 h-4 text-primary" />
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-[9px] text-primary underline cursor-pointer hover:text-primary/70">
                    View cryptographic proof log
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-border bg-card p-6 h-[200px] flex flex-col items-center justify-center space-y-4">
              <Icon
                icon="solar:chart-2-linear"
                className="w-12 h-12 text-muted-foreground opacity-10"
              />
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest text-center max-w-[200px]">
                Temporal activity heatmap processing failed: Incomplete data stream for node_0x42
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer System Hash */}
      <div className="pt-20 flex flex-col items-center justify-center space-y-6 opacity-30">
        <div className="h-px w-full max-w-sm bg-linear-to-r from-transparent via-border to-transparent" />
        <div className="flex gap-8 font-mono text-[10px] uppercase tracking-[0.5em]">
          <span>Internode_v2.4.1</span>
          <span>Sovereign_OS</span>
          <span>Heuristic_Mode_0</span>
        </div>
        <div className="font-mono text-[8px] max-w-lg text-center leading-relaxed">
          RAW_DATA_CHECKSUM: 0xFD29A38BE9102948C71A62512FDBA2C6E...ALL_SYSTEMS_NOMINAL
        </div>
      </div>
    </div>
  );
}
