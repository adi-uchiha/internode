'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { useBreakthroughs } from '@/hooks/useBreakthroughs';
import { format } from 'date-fns';

const Breakthroughs = () => {
  const { data: milestones = [], isLoading } = useBreakthroughs();

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
                {isLoading ? 'Loading...' : `${milestones.length} milestones achieved`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {isLoading ? (
              <div className="p-8 text-center font-mono text-xs text-muted-foreground animate-pulse uppercase">
                Loading breakthroughs...
              </div>
            ) : milestones.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border bg-card">
                <p className="font-mono text-xs text-muted-foreground italic uppercase">
                  No technical breakthroughs recorded yet.
                </p>
              </div>
            ) : (
              milestones?.map(
                (
                  bt: {
                    id: string;
                    date: string;
                    title: string;
                    description: string;
                    skillTags: string[] | null;
                    prLink: string | null;
                    adminComment: string | null;
                    user?: Record<string, unknown>;
                  },
                  index: number
                ) => (
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
                            {format(new Date(bt.date), 'MMMM d, yyyy')}
                          </div>
                          <h3 className="font-display font-semibold text-lg">{bt.title}</h3>
                        </div>
                        <Icon icon="solar:star-bold" className="w-5 h-5 text-primary shrink-0" />
                      </div>

                      <p className="font-mono text-sm text-muted-foreground mb-4">
                        {bt.description}
                      </p>

                      {/* Skill tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {bt.skillTags?.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 border border-border bg-muted font-mono text-xs"
                          >
                            #{tag.replace('#', '')}
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
                              <Icon
                                icon="solar:shield-user-linear"
                                className="w-4 h-4 text-primary"
                              />
                            </div>
                            <div>
                              <div className="font-mono text-xs text-primary uppercase tracking-wider mb-1">
                                Admin Feedback
                              </div>
                              <p className="font-mono text-sm text-foreground">
                                "{bt.adminComment}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Breakthroughs;
