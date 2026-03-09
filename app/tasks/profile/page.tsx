'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { tmMembers, tmTickets, tmActivities, generateHeatmapData } from '@/data/taskManagerData';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const member = tmMembers.find((m) => m.role === (user?.role || 'member')) || tmMembers[1];
  const heatmap = useMemo(() => generateHeatmapData(), []);
  const weeks = useMemo(() => {
    const r: (typeof heatmap)[] = [];
    for (let i = 0; i < heatmap.length; i += 7) r.push(heatmap.slice(i, i + 7));
    return r;
  }, [heatmap]);

  const doneCount =
    tmTickets.filter((t) => t.assigneeId === member.id && t.status === 'done').length + 15;
  const totalTickets = tmTickets.filter((t) => t.assigneeId === member.id).length + 20;
  const totalHours = member.hoursThisWeek * 12;

  const activities = tmActivities.filter((a) => a.memberId === member.id).slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border bg-card p-10 shadow-lg relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <Image
              src={member.avatar}
              alt={member.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-background shadow-xl ring-2 ring-primary/20 transition-all group-hover:ring-primary/50"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary border-4 border-card flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">
              {member.name}
            </h2>
            <p className="font-mono text-sm text-muted-foreground mt-1 opacity-70">
              {member.email}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <span
                className={`font-mono text-[11px] uppercase px-3 py-1 rounded-sm border shadow-sm ${
                  member.role === 'admin'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/50 border-border text-muted-foreground'
                }`}
              >
                {member.role}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/20 px-3 py-1 border border-border rounded-sm">
                <Icon icon="solar:calendar-linear" className="w-3.5 h-3.5" />
                Joined: {member.joinedDate}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tickets', value: totalTickets, color: 'text-foreground' },
          { label: 'Completed', value: doneCount, color: 'text-primary' },
          { label: 'Efficiency', value: `${member.efficiency}%`, color: 'text-blue-500' },
          { label: 'Total Hours', value: `${totalHours}h`, color: 'text-foreground' },
          { label: 'This Month', value: `${member.hoursThisWeek * 4}h`, color: 'text-amber-500' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="border border-border bg-card p-6 shadow-sm hover:border-primary/20 transition-colors group"
          >
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 opacity-50 font-bold">
              {s.label}
            </div>
            <div className={`font-display text-3xl font-bold tracking-tight ${s.color}`}>
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Operational Heatmap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border border-border bg-card p-8 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg tracking-tight">
            Technical Contributions
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
              Less
            </span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-border/50" />
              <div className="w-2.5 h-2.5 bg-primary/20" />
              <div className="w-2.5 h-2.5 bg-primary/40" />
              <div className="w-2.5 h-2.5 bg-primary/60" />
              <div className="w-2.5 h-2.5 bg-primary" />
            </div>
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
              More
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3.5 h-3.5 transition-all duration-300 cursor-pointer hover:ring-1 hover:ring-primary hover:z-10 ${
                    day.hours === 0
                      ? 'bg-border/30'
                      : day.hours <= 2
                        ? 'bg-primary/20'
                        : day.hours <= 4
                          ? 'bg-primary/40'
                          : day.hours <= 6
                            ? 'bg-primary/60'
                            : 'bg-primary shadow-[0_0_8px_rgba(0,255,136,0.2)]'
                  }`}
                  title={`${day.date}: ${day.hours}h`}
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 border border-border bg-card p-8 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <Icon icon="solar:history-linear" className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg tracking-tight">
              Recent System Activity
            </h3>
          </div>
          <div className="space-y-1">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 py-4 border-b border-border/50 last:border-0 group px-2 hover:bg-muted/10 transition-colors"
              >
                <div className="p-2 rounded-sm bg-muted/30 group-hover:bg-primary/10 transition-colors">
                  <Icon
                    icon={
                      a.type === 'time-log'
                        ? 'solar:clock-circle-linear'
                        : a.type === 'completed'
                          ? 'solar:check-circle-linear'
                          : 'solar:document-text-linear'
                    }
                    className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {a.action}{' '}
                    <span className="text-primary font-mono text-[11px] font-bold">
                      [{a.ticketTitle}]
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5 opacity-60">
                    ID: {a.id}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-sm">
                  {a.timestamp}
                </span>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/5">
                <Icon icon="solar:ghost-linear" className="w-10 h-10 mx-auto mb-2 opacity-10" />
                <p className="font-mono text-xs text-muted-foreground">
                  Initial session logs pending.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Global Controls */}
        <div className="space-y-4">
          <div className="border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="font-mono text-[11px] text-primary uppercase font-bold tracking-widest">
              ── Session Controls ──
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-xs border-border/50 hover:border-primary/30"
              >
                <Icon icon="solar:settings-linear" className="w-4 h-4 mr-2" />
                Notification System
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-xs border-border/50 hover:border-primary/30"
              >
                <Icon icon="solar:lock-keyhole-linear" className="w-4 h-4 mr-2" />
                Security Overrides
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-xs border-border/50 hover:border-primary/30"
              >
                <Icon icon="solar:cloud-download-linear" className="w-4 h-4 mr-2" />
                Data Export (.JSON)
              </Button>
            </div>
            <div className="pt-6 border-t border-border/50">
              <button
                onClick={logout}
                className="flex items-center gap-2 font-mono text-xs text-destructive hover:underline transition-all px-2"
              >
                <Icon icon="solar:logout-linear" className="w-4 h-4" />
                TERMINATE SESSION
              </button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-6 space-y-3 opacity-80">
            <div className="font-mono text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-2">
              <Icon icon="solar:shield-check-linear" className="w-3 h-3" />
              Verified Authenticator
            </div>
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
              Your session is encrypted and verified against the InternHub core protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
