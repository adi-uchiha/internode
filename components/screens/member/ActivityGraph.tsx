'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { generateActivityData, generatePerformanceMetrics } from '@/data/mockData';

const ActivityGraph = () => {
  const activityData = useMemo(() => generateActivityData(), []);
  const metrics = useMemo(() => generatePerformanceMetrics(), []);

  // Group data by weeks for the contribution grid
  const weeks = useMemo(() => {
    const result: { date: string; count: number; hours: number }[][] = [];
    let currentWeek: { date: string; count: number; hours: number }[] = [];

    activityData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === activityData.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result.slice(-52); // Last 52 weeks
  }, [activityData]);

  const getIntensityClass = (hours: number) => {
    if (hours === 0) return 'bg-border/50';
    if (hours <= 2) return 'bg-primary/20';
    if (hours <= 4) return 'bg-primary/40';
    if (hours <= 6) return 'bg-primary/60';
    return 'bg-primary';
  };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <MemberLayout title="Activity Graph">
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Hours',
              value: metrics.totalHoursThisMonth,
              suffix: 'h',
              icon: 'solar:clock-circle-linear',
            },
            {
              label: 'Avg Hours/Day',
              value: metrics.avgHoursPerDay.toFixed(1),
              suffix: 'h',
              icon: 'solar:chart-linear',
            },
            {
              label: 'Learning Days',
              value: metrics.learningDays,
              suffix: '',
              icon: 'solar:book-linear',
            },
            {
              label: 'Log Rate',
              value: metrics.logCompletionRate,
              suffix: '%',
              icon: 'solar:check-circle-linear',
            },
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
                  [{stat.label}]
                </span>
              </div>
              <div className="font-display text-3xl font-bold text-primary">
                {stat.value}
                <span className="text-lg text-muted-foreground">{stat.suffix}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card p-6 overflow-x-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-lg">Contribution Graph</h2>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Your daily logging activity over the past year
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-border/50" />
                <div className="w-3 h-3 bg-primary/20" />
                <div className="w-3 h-3 bg-primary/40" />
                <div className="w-3 h-3 bg-primary/60" />
                <div className="w-3 h-3 bg-primary" />
              </div>
              <span className="font-mono text-xs text-muted-foreground">More</span>
            </div>
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {days.map((day, i) => (
                <div key={day} className="h-3 flex items-center">
                  {i % 2 === 1 && (
                    <span className="font-mono text-xs text-muted-foreground w-8">{day}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`w-3 h-3 ${getIntensityClass(day.hours)} transition-all hover:ring-1 hover:ring-primary cursor-pointer`}
                      title={`${day.date}: ${day.hours}h worked`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Month labels */}
          <div className="flex mt-2 ml-10">
            {months.map((month) => (
              <div key={month} className="flex-1 font-mono text-xs text-muted-foreground">
                {month}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Learning vs Execution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-border bg-card p-6"
          >
            <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
              [LEARNING_DAYS]
            </h3>
            <div className="flex items-end gap-4">
              <div className="font-display text-5xl font-bold text-primary">
                {metrics.learningDays}
              </div>
              <div className="pb-2">
                <div className="font-mono text-sm text-foreground">days this month</div>
                <div className="font-mono text-xs text-muted-foreground">
                  Focused on new concepts
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(metrics.learningDays / 30) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="border border-border bg-card p-6"
          >
            <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
              [EXECUTION_DAYS]
            </h3>
            <div className="flex items-end gap-4">
              <div className="font-display text-5xl font-bold text-foreground">
                {metrics.executionDays}
              </div>
              <div className="pb-2">
                <div className="font-mono text-sm text-foreground">days this month</div>
                <div className="font-mono text-xs text-muted-foreground">
                  Building & shipping code
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${(metrics.executionDays / 30) * 100}%` }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default ActivityGraph;
