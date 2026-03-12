'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { useLogs } from '@/hooks/useLogs';

const ActivityGraph = () => {
  const { data: logs } = useLogs();

  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthLogs =
      logs?.filter((l) => {
        const d = new Date(l.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }) || [];

    const totalHoursThisMonth = currentMonthLogs.reduce((sum, l) => sum + (l.hours || 0), 0) || 0;
    const daysLogged = new Set(currentMonthLogs.map((l) => new Date(l.date).toDateString())).size;
    const avgHoursPerDay = daysLogged > 0 ? totalHoursThisMonth / daysLogged : 0;
    const executionDays = currentMonthLogs.filter((l) => (l.hours || 0) > 0 && l.note).length;

    // Roughly days / total days in month
    const logCompletionRate = Math.round(
      (daysLogged / new Date(currentYear, currentMonth + 1, 0).getDate()) * 100
    );

    return { totalHoursThisMonth, avgHoursPerDay, executionDays, logCompletionRate };
  }, [logs]);

  // Group data by weeks for the contribution grid
  const weeks = useMemo(() => {
    const result: { date: string; count: number; hours: number }[][] = [];

    // Map last 364 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    // Make sure we start on a Sunday to align with strict week views
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    let currentWeek: { date: string; count: number; hours: number }[] = [];
    const iterator = new Date(startDate);

    // Create a map to O(1) fetch log hours by day
    const logMap = new Map();
    logs?.forEach((l) => {
      const d = new Date(l.date).toDateString();
      logMap.set(d, (logMap.get(d) || 0) + (l.hours || 0));
    });

    while (iterator <= today || currentWeek.length > 0) {
      if (iterator > today && currentWeek.length === 0) break;

      const dateStr = iterator.toDateString();
      const hoursHit = iterator <= today ? logMap.get(dateStr) || 0 : 0;

      currentWeek.push({
        date: dateStr,
        count: hoursHit > 0 ? 1 : 0,
        hours: hoursHit,
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      iterator.setDate(iterator.getDate() + 1);
    }

    return result;
  }, [logs]);

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
              label: 'Execution Days',
              value: metrics.executionDays,
              suffix: '',
              icon: 'solar:code-linear',
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

        {/* Breakthrough and Execution Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="border border-border bg-card p-6"
          >
            <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
              [ACTIVITY_DAYS]
            </h3>
            <div className="flex items-end gap-4">
              <div className="font-display text-5xl font-bold text-primary">
                {metrics.executionDays}
              </div>
              <div className="pb-2">
                <div className="font-mono text-sm text-foreground">days this month</div>
                <div className="font-mono text-xs text-muted-foreground">
                  Days with logged activities
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(metrics.executionDays / 30) * 100}%` }}
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
              [HOURS_OVERVIEW]
            </h3>
            <div className="flex items-end gap-4">
              <div className="font-display text-5xl font-bold text-foreground">
                {metrics.totalHoursThisMonth}
              </div>
              <div className="pb-2">
                <div className="font-mono text-sm text-foreground">hours this month</div>
                <div className="font-mono text-xs text-muted-foreground">
                  Total productive time logged
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${(metrics.totalHoursThisMonth / 160) * 100}%` }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default ActivityGraph;
