'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { mockDailyLogs } from '@/data/mockData';

const MySkills = () => {
  // Aggregate skill tags from logs
  const skillData = useMemo(() => {
    const tagCount: Record<string, number> = {};

    mockDailyLogs.forEach((log) => {
      log.skillTags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // Add some more variety for demo
    const additionalTags = {
      react: 24,
      typescript: 22,
      tailwind: 18,
      'framer-motion': 12,
      nodejs: 8,
      postgresql: 6,
      docker: 5,
      git: 20,
      testing: 7,
      'api-design': 4,
    };

    Object.entries(additionalTags).forEach(([tag, count]) => {
      tagCount[tag] = (tagCount[tag] || 0) + count;
    });

    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const maxCount = skillData[0]?.count || 1;

  // Skill categories
  const categories = [
    {
      name: 'Frontend',
      tags: ['react', 'typescript', 'tailwind', 'framer-motion', 'css', 'nextjs'],
    },
    { name: 'Backend', tags: ['nodejs', 'postgresql', 'docker', 'api-design', 'redis'] },
    { name: 'DevOps', tags: ['docker', 'git', 'kubernetes', 'aws', 'ci-cd'] },
    { name: 'Core', tags: ['testing', 'git', 'debugging', 'architecture'] },
  ];

  return (
    <MemberLayout title="My Skills">
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Skills', value: skillData.length, icon: 'solar:code-square-linear' },
            { label: 'Top Skill', value: skillData[0]?.tag || '-', icon: 'solar:star-linear' },
            {
              label: 'Logs Analyzed',
              value: mockDailyLogs.length + 45,
              icon: 'solar:document-linear',
            },
            { label: 'Skill Score', value: '87', suffix: '/100', icon: 'solar:graph-up-linear' },
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

        {/* Skill Cloud */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-lg">Skill Cloud</h2>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Technologies you've worked with based on your logs
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {skillData.map((skill, index) => {
              const size = skill.count / maxCount;
              const fontSize = Math.max(0.75, Math.min(1.5, 0.75 + size * 0.75));

              return (
                <motion.div
                  key={skill.tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    px-3 py-2 border transition-all cursor-pointer group
                    ${size > 0.6 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/50'}
                  `}
                  style={{ fontSize: `${fontSize}rem` }}
                >
                  <span className="font-mono">#{skill.tag}</span>
                  <span className="font-mono text-xs text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {skill.count}x
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Skill Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-border bg-card p-6"
        >
          <h2 className="font-display font-semibold text-lg mb-6">Skill Breakdown</h2>

          <div className="space-y-4">
            {skillData.slice(0, 8).map((skill, index) => (
              <div key={skill.tag} className="flex items-center gap-4">
                <div className="w-24 font-mono text-sm truncate">#{skill.tag}</div>
                <div className="flex-1 h-6 bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.count / maxCount) * 100}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="h-full bg-primary"
                  />
                </div>
                <div className="w-12 font-mono text-sm text-muted-foreground text-right">
                  {skill.count}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, i) => {
            const categorySkills = skillData.filter((s) => category.tags.includes(s.tag));
            const totalCount = categorySkills.reduce((sum, s) => sum + s.count, 0);

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="border border-border bg-card p-4"
              >
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  [{category.name}]
                </div>
                <div className="font-display text-3xl font-bold text-foreground mb-2">
                  {categorySkills.length}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {totalCount} total uses
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MemberLayout>
  );
};

export default MySkills;
