'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { generatePerformanceMetrics, generateActivityData } from '@/data/mockData';
import { useMemo } from 'react';

const MemberProfile = () => {
  const { user } = useAuth();
  const metrics = useMemo(() => generatePerformanceMetrics(), []);
  const activityData = useMemo(() => generateActivityData(), []);

  // Calculate some stats
  const totalDaysLogged = activityData.filter((d) => d.count > 0).length;
  const totalHours = activityData.reduce((sum, d) => sum + d.hours, 0);
  const avgHoursPerDay = (totalHours / totalDaysLogged).toFixed(1);

  const skills = [
    'react',
    'typescript',
    'tailwind',
    'framer-motion',
    'nodejs',
    'postgresql',
    'git',
  ];

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
            <div className="w-24 h-24 border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} fill className="object-cover" />
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
                  Frontend Engineer
                </span>
                <span className="px-3 py-1 border border-border font-mono text-xs text-muted-foreground">
                  Joined Jan 2025
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
              label: 'Log Rate',
              value: `${metrics.logCompletionRate}%`,
              icon: 'solar:check-circle-linear',
            },
            { label: 'Avg Hours/Day', value: avgHoursPerDay, icon: 'solar:clock-circle-linear' },
            { label: 'Breakthroughs', value: '5', icon: 'solar:star-linear' },
            { label: 'Skills', value: skills.length.toString(), icon: 'solar:code-square-linear' },
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

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card p-6"
        >
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
            [SKILL_CLOUD]
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-2 border border-border bg-muted font-mono text-sm hover:border-primary/50 transition-colors"
              >
                #{skill}
              </span>
            ))}
          </div>
        </motion.div>

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
          <div className="space-y-3">
            {[
              {
                action: 'Submitted daily log',
                time: '2 hours ago',
                icon: 'solar:document-add-linear',
              },
              {
                action: 'Completed weekly goal: Sidebar component',
                time: '1 day ago',
                icon: 'solar:check-circle-linear',
              },
              {
                action: 'Marked breakthrough: Auth Implementation',
                time: '2 days ago',
                icon: 'solar:star-linear',
              },
              {
                action: 'Added skill tag: framer-motion',
                time: '3 days ago',
                icon: 'solar:code-square-linear',
              },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 border border-border bg-background"
              >
                <Icon icon={activity.icon} className="w-5 h-5 text-muted-foreground" />
                <span className="font-mono text-sm flex-1">{activity.action}</span>
                <span className="font-mono text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Current Project */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              [CURRENT_PROJECT]
            </div>
            <span className="px-2 py-1 border border-primary bg-primary/10 font-mono text-xs text-primary">
              ACTIVE
            </span>
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">Dashboard Revamp</h3>
          <p className="font-mono text-sm text-muted-foreground mb-4">
            Complete overhaul of the main dashboard with new UI/UX
          </p>
          <div className="flex flex-wrap gap-2">
            {['react', 'typescript', 'tailwind', 'framer-motion'].map((tech) => (
              <span key={tech} className="px-2 py-1 border border-border font-mono text-xs">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  );
};

export default MemberProfile;
