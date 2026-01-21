'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export const LoggingFeature = () => {
  const [days, setDays] = useState(
    Array.from({ length: 28 }, () => ({
      active: false,
      intensity: 0,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDays(
        Array.from({ length: 28 }, () => ({
          active: Math.random() > 0.2,
          intensity: Math.floor(Math.random() * 4),
        }))
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full min-h-[400px] p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300 flex flex-col">
      <div className="mb-6">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          [QUICK_LOG]
        </span>
        <h3 className="font-display text-xl font-medium text-foreground mt-2">Daily Logging</h3>
        <p className="text-sm text-muted-foreground mt-1">
          3-minute daily entries that compound into insights
        </p>
      </div>

      {/* Activity Grid */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {days.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className={`aspect-square border ${
                day.active
                  ? day.intensity === 3
                    ? 'bg-primary/80 border-primary/60'
                    : day.intensity === 2
                      ? 'bg-primary/50 border-primary/40'
                      : day.intensity === 1
                        ? 'bg-primary/30 border-primary/30'
                        : 'bg-primary/10 border-primary/20'
                  : 'bg-muted/20 border-border/50'
              }`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-xs text-muted-foreground">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-muted/20 border border-border/50" />
            <div className="w-3 h-3 bg-primary/20 border border-primary/20" />
            <div className="w-3 h-3 bg-primary/40 border border-primary/30" />
            <div className="w-3 h-3 bg-primary/70 border border-primary/50" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">More</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-mono text-2xl text-primary">23</span>
            <span className="font-mono text-xs text-muted-foreground block">days logged</span>
          </div>
          <div>
            <span className="font-mono text-2xl text-foreground">92%</span>
            <span className="font-mono text-xs text-muted-foreground block">completion rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
