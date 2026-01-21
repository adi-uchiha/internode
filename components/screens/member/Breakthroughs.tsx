'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';

const Breakthroughs = () => {
  // Filter for breakthrough logs and add some demo data
  const breakthroughs = [
    {
      id: 'bt-001',
      date: '2025-01-07',
      title: 'First Authentication Implementation',
      description:
        'Successfully implemented session-based authentication with CSRF protection. Learned the difference between JWT and session-based auth.',
      skillTags: ['authentication', 'security', 'react'],
      prLink: 'https://github.com/internode/dashboard/pull/140',
      adminComment: 'Great work on the auth implementation! Consider adding rate limiting.',
    },
    {
      id: 'bt-002',
      date: '2025-01-02',
      title: 'First Production Deployment',
      description:
        'Deployed my first feature to production! Set up CI/CD pipeline and understood the full deployment workflow.',
      skillTags: ['devops', 'ci-cd', 'vercel'],
    },
    {
      id: 'bt-003',
      date: '2024-12-28',
      title: 'Database Query Optimization',
      description:
        'Reduced query time from 2s to 50ms by implementing proper indexing and query optimization techniques.',
      skillTags: ['postgresql', 'performance', 'backend'],
      adminComment: 'Impressive improvement! This is exactly the kind of optimization we need.',
    },
    {
      id: 'bt-004',
      date: '2024-12-20',
      title: 'Complex Animation System',
      description:
        'Built a reusable animation system using Framer Motion with proper performance considerations.',
      skillTags: ['framer-motion', 'react', 'animation'],
    },
    {
      id: 'bt-005',
      date: '2024-12-15',
      title: 'First Pull Request Merged',
      description: 'My first PR got merged to main! Fixed a critical bug in the user dashboard.',
      skillTags: ['git', 'collaboration'],
    },
  ];

  return (
    <MemberLayout title="Breakthroughs">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center">
              <Icon icon="solar:star-bold" className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                [WALL_OF_WINS]
              </div>
              <h1 className="text-2xl font-display font-semibold">Technical Breakthroughs</h1>
              <p className="font-mono text-sm text-muted-foreground mt-1">
                {breakthroughs.length} milestones achieved
              </p>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {breakthroughs.map((bt, index) => (
              <motion.div
                key={bt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-16"
              >
                {/* Timeline dot */}
                <div className="absolute left-4 top-6 w-5 h-5 border-2 border-primary bg-background flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary" />
                </div>

                <div className="border border-border bg-card p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground mb-1">
                        {new Date(bt.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <h3 className="font-display font-semibold text-lg">{bt.title}</h3>
                    </div>
                    <Icon icon="solar:star-bold" className="w-5 h-5 text-primary shrink-0" />
                  </div>

                  <p className="font-mono text-sm text-muted-foreground mb-4">{bt.description}</p>

                  {/* Skill tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bt.skillTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 border border-border bg-muted font-mono text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* PR Link */}
                  {bt.prLink && (
                    <a
                      href={bt.prLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-mono text-xs text-primary hover:underline"
                    >
                      <Icon icon="solar:link-linear" className="w-4 h-4" />
                      View Pull Request
                    </a>
                  )}

                  {/* Admin Comment */}
                  {bt.adminComment && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon icon="solar:shield-user-linear" className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-mono text-xs text-primary uppercase tracking-wider mb-1">
                            Admin Feedback
                          </div>
                          <p className="font-mono text-sm text-foreground">"{bt.adminComment}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Breakthroughs;
