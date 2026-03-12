import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useFeedback, useSubmitFeedback } from '@/hooks/useFeedback';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const AdminFeedback = () => {
  const { data, isLoading } = useFeedback();
  const { mutateAsync: submitFeedback } = useSubmitFeedback();
  const [activeTab, setActiveTab] = useState<'logs' | 'breakthroughs'>('logs');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const pendingLogs = data?.logs || [];
  const pendingBreakthroughs = data?.breakthroughs || [];

  const handleCommentChange = (id: string, value: string) => {
    setComments((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (id: string, type: 'log' | 'breakthrough') => {
    const comment = comments[id];
    if (!comment?.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingId(id);
    try {
      await submitFeedback({ id, type, comment });
      toast.success('Feedback submitted');
      setComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <AdminLayout title="Mentorship Feedback">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-8">
          {[
            { id: 'logs', label: 'Daily Logs', count: pendingLogs.length },
            { id: 'breakthroughs', label: 'Breakthroughs', count: pendingBreakthroughs.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'logs' | 'breakthroughs')}
              className={`pb-4 px-2 font-mono text-sm uppercase tracking-wider transition-all relative ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label} [{tab.count}]
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-20 font-mono text-sm text-muted-foreground animate-pulse">
            SCANNING FOR PENDING ITEMS...
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {activeTab === 'logs' ? (
                pendingLogs.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-border bg-card/50">
                    <p className="font-mono text-sm text-muted-foreground">ALL LOGS REVIEWED</p>
                  </div>
                ) : (
                  pendingLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border border-border bg-card p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border border-border bg-muted flex items-center justify-center font-mono text-lg font-bold">
                            {log.user?.name?.[0]}
                          </div>
                          <div>
                            <div className="font-mono text-sm font-semibold">{log.user?.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {new Date(log.date).toLocaleDateString()} • {log.hours}h
                            </div>
                          </div>
                        </div>
                        {log.isBreakthrough && (
                          <div className="px-2 py-0.5 border border-primary bg-primary/10 text-primary font-mono text-[10px] uppercase">
                            Breakthrough
                          </div>
                        )}
                      </div>

                      <div className="bg-background border border-border p-4 mb-4 font-mono text-sm">
                        <div className="text-muted-foreground text-[10px] uppercase mb-2">
                          [MEMBER_LOG]
                        </div>
                        {log.note}
                      </div>

                      <div className="space-y-3">
                        <Textarea
                          value={comments[log.id] || ''}
                          onChange={(e) => handleCommentChange(log.id, e.target.value)}
                          placeholder="Provide mentorship feedback or guidance..."
                          className="bg-background border-border font-mono text-sm min-h-[80px]"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleSubmit(log.id, 'log')}
                            variant="hero"
                            size="sm"
                            disabled={submittingId === log.id}
                          >
                            {submittingId === log.id ? (
                              <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                            ) : (
                              <Icon icon="solar:check-circle-linear" className="w-4 h-4" />
                            )}
                            SUBMIT FEEDBACK
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )
              ) : pendingBreakthroughs.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border bg-card/50">
                  <p className="font-mono text-sm text-muted-foreground">
                    ALL BREAKTHROUGHS REVIEWED
                  </p>
                </div>
              ) : (
                pendingBreakthroughs.map((bt) => (
                  <motion.div
                    key={bt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border border-border bg-card p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-2 border-primary bg-primary/10 flex items-center justify-center">
                          <Icon icon="solar:star-bold" className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-mono text-sm font-semibold">{bt.user?.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {new Date(bt.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border p-4 mb-4">
                      <h4 className="font-display font-bold mb-2">{bt.title}</h4>
                      <p className="font-mono text-sm text-muted-foreground">{bt.description}</p>
                      {bt.skillTags && bt.skillTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {bt.skillTags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 border border-border bg-muted font-mono text-[10px]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        value={comments[bt.id] || ''}
                        onChange={(e) => handleCommentChange(bt.id, e.target.value)}
                        placeholder="Congratulations or guiding comments..."
                        className="bg-background border-border font-mono text-sm min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSubmit(bt.id, 'breakthrough')}
                          variant="hero"
                          size="sm"
                          disabled={submittingId === bt.id}
                        >
                          {submittingId === bt.id ? (
                            <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon icon="solar:star-linear" className="w-4 h-4" />
                          )}
                          LOG MENTORSHIP
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;
