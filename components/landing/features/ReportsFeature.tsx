'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

export const ReportsFeature = () => {
  return (
    <div className="h-full min-h-[200px] p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300">
      <div className="mb-6">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          [AUTO_REPORTS]
        </span>
        <h3 className="font-display text-xl font-medium text-foreground mt-2">Automated Reports</h3>
      </div>

      {/* Report Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="p-4 bg-background/50 border border-border/50"
      >
        <div className="flex items-center gap-3 mb-3">
          <Icon icon="solar:file-text-linear" className="w-5 h-5 text-primary" />
          <div>
            <span className="font-mono text-xs text-foreground block">weekly_summary.pdf</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              Generated Dec 29, 2025
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs font-mono text-muted-foreground">
          <div className="flex justify-between">
            <span>Total Hours</span>
            <span className="text-foreground">127.5h</span>
          </div>
          <div className="flex justify-between">
            <span>Top Performer</span>
            <span className="text-primary">Alex Chen</span>
          </div>
          <div className="flex justify-between">
            <span>Blockers Resolved</span>
            <span className="text-foreground">8/9</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
