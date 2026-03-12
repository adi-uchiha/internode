'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { useLogs, type TimerLog } from '@/hooks/useLogs';

const MonthlyView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: logs } = useLogs();

  const metrics = useMemo(() => {
    const currentMonthLogs =
      logs?.filter((l) => {
        const d = new Date(l.date);
        return (
          d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
        );
      }) || [];
    const totalHoursThisMonth = currentMonthLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
    const daysLogged = new Set(currentMonthLogs.map((l) => new Date(l.date).toDateString())).size;
    const breakthroughs = currentMonthLogs.filter((l) => l.isBreakthrough).length;
    const avgHoursPerDay = daysLogged > 0 ? totalHoursThisMonth / daysLogged : 0;

    return { totalHoursThisMonth, daysLogged, breakthroughs, avgHoursPerDay };
  }, [logs, currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: Date | null; log?: TimerLog }[] = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
      days.push({ date: null });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const log = logs?.find((l) => new Date(l.date).toDateString() === date.toDateString());
      days.push({ date, log });
    }

    return days;
  }, [currentMonth, logs]);

  const navigateMonth = (direction: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDayStatus = (log?: TimerLog) => {
    if (!log) return 'none';
    if (log.isBreakthrough) return 'breakthrough';
    return 'logged';
  };

  return (
    <MemberLayout title="Monthly View">
      <div className="space-y-8">
        {/* Month Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Hours',
              value: metrics.totalHoursThisMonth,
              suffix: 'h',
              icon: 'solar:clock-circle-linear',
            },
            {
              label: 'Days Logged',
              value: metrics.daysLogged,
              suffix: `/${new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()}`,
              icon: 'solar:calendar-linear',
            },
            { label: 'Breakthroughs', value: metrics.breakthroughs, icon: 'solar:star-linear' },
            {
              label: 'Avg Hours/Day',
              value: metrics.avgHoursPerDay.toFixed(1),
              suffix: 'h',
              icon: 'solar:chart-linear',
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
              <div className="font-display text-2xl font-bold text-foreground">
                {stat.value}
                {stat.suffix && (
                  <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card p-6"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-muted/50 transition-colors"
            >
              <Icon icon="solar:alt-arrow-left-linear" className="w-5 h-5" />
            </button>

            <h2 className="font-display font-semibold text-xl">{monthName}</h2>

            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-muted/50 transition-colors"
            >
              <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5" />
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-mono text-xs text-muted-foreground uppercase tracking-wider py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day.date) {
                return <div key={index} className="aspect-square" />;
              }

              const status = getDayStatus(day.log);
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`
                    aspect-square border p-2 flex flex-col justify-between cursor-pointer transition-all
                    ${isToday ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}
                    ${status === 'none' && day.date < new Date() && !isToday ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-sm ${isToday ? 'text-primary font-bold' : 'text-foreground'}`}
                    >
                      {day.date.getDate()}
                    </span>
                    {status !== 'none' && (
                      <div
                        className={`w-2 h-2 ${status === 'breakthrough' ? 'bg-yellow-500' : 'bg-primary'}`}
                      />
                    )}
                  </div>

                  {day.log && (
                    <div className="text-right">
                      <span className="font-mono text-xs text-muted-foreground">
                        {day.log.hours}h
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary" />
              <span className="font-mono text-xs text-muted-foreground">Logged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500" />
              <span className="font-mono text-xs text-muted-foreground">Breakthrough</span>
            </div>
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  );
};

export default MonthlyView;
