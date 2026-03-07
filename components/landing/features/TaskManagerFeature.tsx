"use client";

import { motion } from 'framer-motion';

export const TaskManagerFeature = () => {
  const columns = [
    { name: 'TO-DO', count: 3, color: 'bg-muted-foreground' },
    { name: 'IN PROGRESS', count: 2, color: 'bg-blue-500' },
    { name: 'DONE', count: 4, color: 'bg-primary' },
  ];

  return (
    <div className="h-full min-h-[280px] p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300 group">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">[TASK_MANAGER]</span>
          <h3 className="font-display text-xl font-medium text-foreground mt-2">
            Kanban & Time Tracking
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Jira-like task management built into Internode
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {columns.map((col, i) => (
          <motion.div
            key={col.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex-1"
          >
            <div className={`border-t-2 ${col.color} border-x border-b border-border bg-background/50 p-2`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] text-muted-foreground uppercase">{col.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground">({col.count})</span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: Math.min(col.count, 2) }).map((_, j) => (
                  <div key={j} className="h-6 bg-muted/50 border border-border/50" />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
          <span className="font-mono text-[9px] text-muted-foreground">Time tracking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          <span className="font-mono text-[9px] text-muted-foreground">Drag & drop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          <span className="font-mono text-[9px] text-muted-foreground">Analytics</span>
        </div>
      </div>
    </div>
  );
};
