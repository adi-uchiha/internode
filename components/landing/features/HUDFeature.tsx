import { motion } from 'framer-motion';

export const HUDFeature = () => {
  const interns = [
    { name: 'Alex Chen', status: 'green', time: '09:14', task: 'Implementing auth flow' },
    { name: 'Sarah Kim', status: 'yellow', time: '10:32', task: 'Blocked: API timeout' },
    { name: 'Marcus Lee', status: 'green', time: '08:45', task: 'Code review complete' },
    { name: 'Priya Patel', status: 'red', time: '--:--', task: 'Missing log' },
  ];

  return (
    <div className="h-full min-h-[320px] p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300 group">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            [HUD_DISPLAY]
          </span>
          <h3 className="font-display text-xl font-medium text-foreground mt-2">
            Heads-Up Display
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of all active interns at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-xs text-primary">LIVE</span>
        </div>
      </div>

      {/* HUD Visualization */}
      <div className="space-y-3">
        {interns.map((intern, i) => (
          <motion.div
            key={intern.name}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex items-center gap-4 p-3 bg-background/50 border border-border/50 hover:border-border transition-colors"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                intern.status === 'green'
                  ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]'
                  : intern.status === 'yellow'
                    ? 'bg-yellow-500 shadow-[0_0_8px_hsl(45_100%_50%)]'
                    : 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]'
              }`}
            />
            <span className="font-mono text-xs text-muted-foreground w-12">{intern.time}</span>
            <span className="font-display text-sm text-foreground flex-1">{intern.name}</span>
            <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
              {intern.task}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
