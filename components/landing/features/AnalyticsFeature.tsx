'use client';

import { motion } from 'framer-motion';

export const AnalyticsFeature = () => {
  const bars = [65, 82, 45, 90, 72, 88, 55];

  return (
    <div className="h-full min-h-[280px] p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300">
      <div className="mb-6">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          [ANALYTICS]
        </span>
        <h3 className="font-display text-xl font-medium text-foreground mt-2">
          Performance Heatmaps
        </h3>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between h-24 gap-2">
        {bars.map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${height}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
            className="flex-1 bg-gradient-to-t from-primary/60 to-primary/20 border-t border-primary/80"
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        <span className="font-mono text-[10px] text-muted-foreground">Mon</span>
        <span className="font-mono text-[10px] text-muted-foreground">Sun</span>
      </div>

      {/* Metric */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">Avg Efficiency</span>
        <span className="font-mono text-lg text-primary">71%</span>
      </div>
    </div>
  );
};
