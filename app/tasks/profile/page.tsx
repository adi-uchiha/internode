'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { useActivities } from '@/hooks/useActivities';
import { useUpdateProfile } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const { user, orgRole, logout } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  const { data: tickets } = useTickets({ assigneeId: user?.id });
  const { data: activities } = useActivities({ userId: user?.id, limit: 10 });

  const userLogs = useMemo(() => {
    if (!tickets || !user) return [];
    return tickets.flatMap((t) => t.timeLogs || []).filter((l) => l.userId === user.id);
  }, [tickets, user]);

  const stats = useMemo(() => {
    if (!tickets || !user)
      return { totalTickets: 0, doneCount: 0, efficiency: 0, totalHours: 0, monthHours: 0 };

    const myTickets = tickets.filter((t) => t.assigneeId === user.id);
    const doneTickets = myTickets.filter((t) => t.status === 'done');

    const totalHours = myTickets.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

    // Efficiency calculation: average (estimated / logged) for completed tasks
    const efficiency =
      doneTickets.length > 0
        ? Math.round(
            (doneTickets.reduce((sum, t) => {
              const ratio =
                t.estimatedHours > 0 ? t.estimatedHours / Math.max(t.loggedHours, 0.1) : 1;
              return sum + Math.min(ratio, 1.5); // cap at 150%
            }, 0) /
              doneTickets.length) *
              100
          )
        : 0;

    const monthHours = userLogs
      .filter((l) => {
        const d = new Date(l.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, l) => sum + (l.hours || 0), 0);

    return {
      totalTickets: myTickets.length,
      doneCount: doneTickets.length,
      efficiency,
      totalHours,
      monthHours,
    };
  }, [tickets, user, userLogs]);

  const heatmap = useMemo(() => {
    const data = [];
    for (let i = 90; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dayLogs = userLogs.filter((l) => isSameDay(new Date(l.date), date));
      const hours = dayLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
      data.push({ date: format(date, 'yyyy-MM-dd'), hours });
    }
    return data;
  }, [userLogs]);

  const weeks = useMemo(() => {
    const r = [];
    for (let i = 0; i < heatmap.length; i += 7) r.push(heatmap.slice(i, i + 7));
    return r;
  }, [heatmap]);

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
          <AvatarUpload
            currentImageUrl={user?.image}
            userId={user?.id ?? ''}
            size="lg"
            onUploadComplete={(url) => updateProfileMutation.mutate({ id: user?.id, image: url })}
          />
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">
                  {user?.name || 'Anonymous User'}
                </h2>
                <p className="font-mono text-sm text-muted-foreground mt-1 opacity-70 flex items-center gap-2">
                  <Icon icon="solar:letter-linear" className="w-3.5 h-3.5" />
                  {user?.email}
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-end gap-3 text-right">
                <div className="space-y-1">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest opacity-50 font-bold">
                    Joined
                  </div>
                  <div className="font-mono text-sm font-semibold">
                    {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : '[UNKNOWN]'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
              <span
                className={`font-mono text-[10px] uppercase px-3 py-1.5 rounded-sm border shadow-sm flex items-center gap-1.5 ${
                  orgRole === 'admin' || orgRole === 'owner'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/50 border-border text-muted-foreground'
                }`}
              >
                <Icon
                  icon={
                    orgRole === 'admin' || orgRole === 'owner'
                      ? 'solar:shield-star-linear'
                      : 'solar:user-linear'
                  }
                  className="w-3.5 h-3.5"
                />
                {orgRole}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tickets', value: stats.totalTickets, color: 'text-foreground' },
          { label: 'Completed', value: stats.doneCount, color: 'text-primary' },
          { label: 'Efficiency', value: `${stats.efficiency}%`, color: 'text-blue-500' },
          {
            label: 'Total Hours',
            value: `${stats.totalHours.toFixed(1)}h`,
            color: 'text-foreground',
          },
          {
            label: 'This Month',
            value: `${stats.monthHours.toFixed(1)}h`,
            color: 'text-amber-500',
          },
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
            {activities?.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 py-4 border-b border-border/50 last:border-0 group px-2 hover:bg-muted/10 transition-colors"
              >
                <div className="p-2 rounded-sm bg-muted/30 group-hover:bg-primary/10 transition-colors">
                  <Icon
                    icon={
                      a.type === 'status'
                        ? 'solar:check-circle-linear'
                        : a.type === 'time-log'
                          ? 'solar:clock-circle-linear'
                          : 'solar:document-text-linear'
                    }
                    className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.action}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5 opacity-60">
                    ID: {a.id}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-sm">
                  {format(new Date(a.createdAt), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
            {activities?.length === 0 && (
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
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <button className="flex items-center gap-2 font-mono text-xs text-destructive hover:underline transition-all px-2" />
                  }
                >
                  <Icon icon="solar:logout-linear" className="w-4 h-4" />
                  TERMINATE SESSION
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to terminate your session?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to log back in to access your organization and dashboard.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => logout()} variant="destructive">
                      Log out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
