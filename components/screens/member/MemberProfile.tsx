'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLogs } from '@/hooks/useLogs';

const MemberProfile = () => {
  const { user } = useAuth();
  const { data: logs } = useLogs();

  const totalDaysLogged = new Set(logs?.map((l) => new Date(l.date).toDateString())).size || 0;
  const totalHours = logs?.reduce((sum, l) => sum + (l.hours || 0), 0) || 0;
  const avgHoursPerDay = totalDaysLogged > 0 ? (totalHours / totalDaysLogged).toFixed(1) : '0.0';
  const breakthroughs = logs?.filter((l) => l.isBreakthrough).length || 0;

  const recentActivity =
    logs?.slice(0, 5).map((l) => ({
      id: l.id,
      action: l.isBreakthrough ? `Breakthrough: ${l.note}` : `Logged ${l.hours}h: ${l.note}`,
      time: new Date(l.date).toLocaleDateString(),
      icon: l.isBreakthrough ? 'solar:star-linear' : 'solar:document-add-linear',
    })) || [];

  return (
    <MemberLayout title="Profile">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-card p-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Icon icon="solar:user-linear" className="w-12 h-12 text-primary" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                [INTERN_PROFILE]
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">{user?.name}</h1>
              <p className="font-mono text-muted-foreground mb-4">{user?.email}</p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-3 py-1 border border-primary bg-primary/10 font-mono text-xs text-primary uppercase">
                  {user?.department || 'Engineering'}
                </span>
                <span className="px-3 py-1 border border-border font-mono text-xs text-muted-foreground">
                  Joined{' '}
                  {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 md:flex-col md:items-end">
              <div className="text-center md:text-right">
                <div className="font-display text-2xl font-bold text-primary">
                  {totalDaysLogged}
                </div>
                <div className="font-mono text-xs text-muted-foreground">Days Logged</div>
              </div>
              <div className="text-center md:text-right">
                <div className="font-display text-2xl font-bold text-foreground">{totalHours}</div>
                <div className="font-mono text-xs text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Logs',
              value: logs?.length?.toString() || '0',
              icon: 'solar:document-text-linear',
            },
            { label: 'Avg Hours/Day', value: avgHoursPerDay, icon: 'solar:clock-circle-linear' },
            { label: 'Breakthroughs', value: breakthroughs.toString(), icon: 'solar:star-linear' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon icon={stat.icon} className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border border-border bg-card p-6"
        >
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
            [RECENT_ACTIVITY]
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 border border-border bg-background"
                >
                  <Icon icon={activity.icon} className="w-5 h-5 text-muted-foreground" />
                  <span className="font-mono text-sm flex-1 truncate">{activity.action}</span>
                  <span className="font-mono text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-sm text-muted-foreground">
              No recent activity found. Start logging your work to build your profile.
            </p>
          )}
        </motion.div>
      </div>
    </MemberLayout>
  );
};

export default MemberProfile;
