'use client';

import { motion } from 'framer-motion';

export const SkillsFeature = () => {
  const skills = [
    { name: 'react', count: 24, size: 'lg' },
    { name: 'typescript', count: 18, size: 'lg' },
    { name: 'nextjs', count: 12, size: 'md' },
    { name: 'tailwind', count: 15, size: 'md' },
    { name: 'prisma', count: 8, size: 'sm' },
    { name: 'postgres', count: 6, size: 'sm' },
    { name: 'docker', count: 4, size: 'sm' },
  ];

  return (
    <div className="h-full min-h-[200px] p-6 border border-border bg-card hover:border-primary/30 transition-colors duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            [SKILL_CLOUD]
          </span>
          <h3 className="font-display text-xl font-medium text-foreground mt-2">
            Skill Tagging System
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">Auto-aggregated from logs</span>
      </div>

      {/* Skill Cloud */}
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 border font-mono
              ${
                skill.size === 'lg'
                  ? 'bg-primary/10 border-primary/30 text-primary text-sm'
                  : skill.size === 'md'
                    ? 'bg-muted/50 border-border text-foreground text-xs'
                    : 'bg-muted/30 border-border/50 text-muted-foreground text-xs'
              }
            `}
          >
            <span>#</span>
            <span>{skill.name}</span>
            <span className="opacity-50">({skill.count})</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
