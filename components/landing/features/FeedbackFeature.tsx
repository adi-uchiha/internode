"use client";

import { motion } from 'framer-motion';

export const FeedbackFeature = () => {
  return (
    <div className="h-full min-h-[280px] p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300">
      <div className="mb-6">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">[FEEDBACK]</span>
        <h3 className="font-display text-xl font-medium text-foreground mt-2">
          Threaded Comments
        </h3>
      </div>

      {/* Comment visualization */}
      <div className="space-y-3">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-3 bg-background/50 border-l-2 border-primary/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40" />
            <span className="font-mono text-xs text-primary">CTO</span>
            <span className="font-mono text-[10px] text-muted-foreground">12:34</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Try using <code className="text-primary bg-primary/10 px-1">Promise.all</code> here for parallel fetching
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-3 bg-background/50 border-l-2 border-border ml-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-muted border border-border" />
            <span className="font-mono text-xs text-foreground">Intern</span>
            <span className="font-mono text-[10px] text-muted-foreground">12:41</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Updated! Reduced load time by 340ms
          </p>
        </motion.div>
      </div>
    </div>
  );
};
