'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { useLogs } from '@/hooks/useLogs';
import { useAuth } from '@/contexts/AuthContext';

const MySkills = () => {
  const { user } = useAuth();
  // Fetch logs specifically for this member
  const { data: logs = [], isLoading } = useLogs(user?.id);

  // Aggregate skill tags from logs
  const skillData = useMemo(() => {
    const tagCount: Record<string, number> = {};

    // Aggregation from logs is no longer possible as skillTags were moved to user profile or breakthroughs
    // For now, we'll return an empty array or use user profile skillTags
    if (user?.skillTags) {
      user.skillTags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase();
        tagCount[normalizedTag] = (tagCount[normalizedTag] || 0) + 1;
      });
    }

    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [user]);

  const maxCount = skillData[0]?.count || 1;

  // Skill categories
  const categories = [
    {
      name: 'Frontend',
      tags: ['react', 'typescript', 'tailwind', 'framer-motion', 'css', 'nextjs'],
    },
    { name: 'Backend', tags: ['nodejs', 'postgresql', 'docker', 'api-design', 'redis', 'drizzle'] },
    { name: 'DevOps', tags: ['docker', 'git', 'kubernetes', 'aws', 'ci-cd'] },
    { name: 'Core', tags: ['testing', 'git', 'debugging', 'architecture'] },
  ];

  return (
    <MemberLayout title="My Skills">
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Skills',
              value: isLoading ? '...' : skillData.length,
              icon: 'solar:code-square-linear',
            },
            {
              label: 'Top Skill',
              value: isLoading ? '...' : skillData[0]?.tag || '-',
              icon: 'solar:star-linear',
            },
            {
              label: 'Logs Analyzed',
              value: isLoading ? '...' : logs.length,
              icon: 'solar:document-linear',
            },
            {
              label: 'Skill Score',
              value: isLoading
                ? '...'
                : Math.min(
                    100,
                    Math.round(
                      skillData.length * 5 + logs.reduce((sum, l) => sum + (l.hours || 0), 0) / 10
                    )
                  ).toString(),
              suffix: '/100',
              icon: 'solar:graph-up-linear',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-border bg-card p-4 relative overflow-hidden"
            >
              {isLoading && <div className="absolute inset-0 bg-muted/20 animate-pulse" />}
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <Icon icon={stat.icon} className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  [{stat.label}]
                </span>
              </div>
              <div
                className={`font-display text-2xl font-bold relative z-10 ${isLoading ? 'text-transparent' : 'text-foreground'}`}
              >
                {stat.value}
                {stat.suffix && !isLoading && (
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

          <div className="flex flex-wrap gap-3 min-h-[100px] items-center">
            {isLoading ? (
              <div className="w-full text-center text-muted-foreground font-mono text-sm animate-pulse">
                Calculating metadata...
              </div>
            ) : skillData.length === 0 ? (
              <div className="w-full text-center text-muted-foreground font-mono text-sm border border-dashed border-border py-8">
                No skills logged yet. Create your first daily log to generate a cloud.
              </div>
            ) : (
              skillData.map((skill, index) => {
                const size = Math.min(skill.count / maxCount, 1);
                const fontSize = Math.max(0.75, Math.min(1.5, 0.75 + size * 0.75));

                return (
                  <motion.div
                    key={skill.tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                        px-3 py-2 border transition-all cursor-pointer group rounded-sm
                        ${size > 0.6 ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20' : 'border-border bg-card hover:border-primary/50 text-foreground'}
                      `}
                    style={{ fontSize: `${fontSize}rem` }}
                  >
                    <span className="font-mono">#{skill.tag}</span>
                    <span className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 bg-primary text-primary-foreground min-w-[20px] h-[20px] flex items-center justify-center rounded-full">
                      {skill.count}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Skill Breakdown */}
        {skillData.length > 0 && !isLoading && (
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
                  <div className="flex-1 h-6 bg-muted overflow-hidden relative rounded-r-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(skill.count / maxCount) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className="absolute left-0 top-0 bottom-0 bg-primary/80"
                    />
                  </div>
                  <div className="w-12 font-mono text-sm text-muted-foreground text-right font-bold">
                    {skill.count}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Category Breakdown */}
        {!isLoading && (
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
                  <div
                    className={`font-display text-3xl font-bold mb-2 ${totalCount > 0 ? 'text-primary' : 'text-muted-foreground opacity-50'}`}
                  >
                    {categorySkills.length}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {totalCount} total uses
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default MySkills;
