'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useFeedback, useSubmitFeedback } from '@/hooks/useFeedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { RequireRole } from '@/components/auth/RequireRole';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';

export default function AdminReviewPage() {
  const { data, isLoading } = useFeedback();
  const { mutateAsync: submitFeedback } = useSubmitFeedback();
  const [comments, setComments] = useState<Record<string, string>>({});

  const handleCommentSubmit = async (id: string, type: 'log' | 'breakthrough') => {
    const comment = comments[id];
    if (!comment?.trim()) {
      toast.error('Feedback content required');
      return;
    }

    try {
      await submitFeedback({ id, type, comment });
      toast.success('Feedback synchronized');
      setComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      toast.error('Feedback sync failed');
    }
  };

  return (
    <RequireRole role="admin">
      <div className="space-y-8 max-w-6xl mx-auto py-6">
        <div>
          <h2 className="font-display font-bold text-4xl tracking-tighter">ADMIN_REVIEW</h2>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">
            System-wide verification and quality control hub
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Logs */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-primary/10 rounded-sm">
                <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl uppercase italic">Pending Logs</h3>
              <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded-full">
                {data?.logs.length || 0}
              </span>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center border border-border bg-card/50">
                <UnifiedLoader message="LOADING_PENDING_LOGS..." size="sm" />
              </div>
            ) : data?.logs.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border bg-muted/5 opacity-50">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  All time logs verified
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.logs.map((log) => (
                  <div key={log.id} className="border border-border bg-card p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-display font-bold">{log.user?.name}</div>
                        <div className="font-mono text-[9px] text-muted-foreground uppercase">
                          {format(new Date(log.date), 'MMM dd, yyyy')} · {log.hours}h
                        </div>
                      </div>
                      {log.isBreakthrough && (
                        <div className="font-mono text-[8px] bg-primary/10 text-primary px-2 py-0.5 border border-primary/20 rounded-full animate-pulse">
                          BREAKTHROUGH_LINKED
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic font-mono opacity-80 border-l-2 border-border pl-3">
                      "{log.note}"
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Add administrative comment..."
                        className="h-9 font-mono text-[10px] bg-muted/30 border-border"
                        value={comments[log.id] || ''}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [log.id]: e.target.value }))
                        }
                      />
                      <Button
                        variant="hero"
                        size="sm"
                        className="h-9 px-4 font-mono text-[10px] uppercase"
                        onClick={() => handleCommentSubmit(log.id, 'log')}
                      >
                        Commit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending Breakthroughs */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-primary/10 rounded-sm">
                <Icon icon="solar:star-fall-2-bold" className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl uppercase italic">Pending Honors</h3>
              <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded-full">
                {data?.breakthroughs.length || 0}
              </span>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center border border-border bg-card/50">
                <UnifiedLoader message="LOADING_PENDING_HONORS..." size="sm" />
              </div>
            ) : data?.breakthroughs.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border bg-muted/5 opacity-50">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  All honors processed
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.breakthroughs.map((b) => (
                  <div
                    key={b.id}
                    className="border border-border bg-card p-4 space-y-3 overflow-hidden"
                  >
                    <div className="font-display font-bold">{b.user?.name}</div>
                    <div className="font-mono text-xs uppercase tracking-tight text-primary">
                      {b.title}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-2">
                      {b.description}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Award comment (e.g. Exceptional optimization!)"
                        className="h-9 font-mono text-[10px] bg-muted/30 border-border"
                        value={comments[b.id] || ''}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [b.id]: e.target.value }))
                        }
                      />
                      <Button
                        variant="hero"
                        size="sm"
                        className="h-9 px-4 font-mono text-[10px] uppercase"
                        onClick={() => handleCommentSubmit(b.id, 'breakthrough')}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </RequireRole>
  );
}
