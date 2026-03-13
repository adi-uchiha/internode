'use client';

import { motion } from 'framer-motion';

type Task = {
  id: string;
  title: string;
  tags: string[];
  points: number;
  active?: boolean;
};

type Column = {
  name: string;
  count: number;
  color: string;
  indicator: string;
  tasks: Task[];
};

export const TaskManagerFeature = () => {
  const columns: Column[] = [
    {
      name: 'TO-DO',
      count: 3,
      color: 'border-muted-foreground/30',
      indicator: 'bg-muted-foreground',
      tasks: [
        { id: 'INT-042', title: 'Database Schema Migration', tags: ['DB', 'API'], points: 5 },
        { id: 'INT-043', title: 'Review Auth Flow', tags: ['SEC'], points: 3 },
      ],
    },
    {
      name: 'IN_PROGRESS',
      count: 2,
      color: 'border-blue-500/50',
      indicator: 'bg-blue-500',
      tasks: [
        {
          id: 'INT-038',
          title: 'WebSocket Integration',
          tags: ['WS', 'CORE'],
          points: 8,
          active: true,
        },
      ],
    },
    {
      name: 'DONE',
      count: 24,
      color: 'border-primary/50',
      indicator: 'bg-primary',
      tasks: [{ id: 'INT-035', title: 'Setup CI/CD Pipeline', tags: ['INFRA'], points: 5 }],
    },
  ];

  return (
    <div className="h-full min-h-[280px] p-6 border border-border bg-[#0a0a0a] hover:border-primary/30 transition-colors duration-300 group flex flex-col relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            [TASK_MANAGER]
          </span>
          <h3 className="font-display text-xl font-medium text-foreground mt-2">
            Kanban & Time Tracking
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Jira-like task management built into Internode
          </p>
        </div>
      </div>

      <div className="flex gap-3 relative z-10 flex-1">
        {columns.map((col, i) => (
          <motion.div
            key={col.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex-1 flex flex-col"
          >
            <div
              className={`border-t-2 ${col.color} bg-card/40 border-x border-b border-border p-3 flex-1 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${col.indicator}`} />
                  {col.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">[{col.count}]</span>
              </div>
              <div className="space-y-2">
                {col.tasks.map((task, j) => (
                  <motion.div
                    key={j}
                    className={`p-2.5 bg-background border ${task.active ? 'border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'border-border/60'} group/card hover:border-primary/40 transition-colors`}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[9px] text-muted-foreground group-hover/card:text-primary transition-colors">
                        {task.id}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {task.points}pt
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 font-medium leading-tight mb-3">
                      {task.title}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[8px] px-1 py-0.5 bg-muted text-muted-foreground rounded-sm"
                        >
                          {'{'}
                          {tag}
                          {'}'}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-6 relative z-10 border-t border-border/50 pt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-primary/80 rounded-sm" />
          <span className="font-mono text-[10px] text-muted-foreground">{'<TimeTracking />'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-blue-500/80 rounded-sm" />
          <span className="font-mono text-[10px] text-muted-foreground">{'<DragDrop />'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-amber-500/80 rounded-sm" />
          <span className="font-mono text-[10px] text-muted-foreground">{'<Analytics />'}</span>
        </div>
      </div>
    </div>
  );
};
