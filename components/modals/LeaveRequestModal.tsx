'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateLeave } from '@/hooks/useLeaves';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaveRequestModal({ isOpen, onClose }: LeaveRequestModalProps) {
  const [type, setType] = useState('vacation');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const { mutateAsync: createLeave, isPending } = useCreateLeave();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error('Date selection required');
      return;
    }

    try {
      await createLeave({
        type,
        date: new Date(date).toISOString(),
        reason,
      });
      toast.success('Leave request submitted for review');
      onClose();
      // Reset
      setType('vacation');
      setDate('');
      setReason('');
    } catch {
      toast.error('Submission failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md border border-border bg-card z-101 shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-primary/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-sm bg-primary/10">
                    <Icon
                      icon="solar:calendar-minimalistic-linear"
                      className="w-6 h-6 text-primary"
                    />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-2xl tracking-tight uppercase">
                      Request Leave
                    </h2>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Submit sabbatical or medical intent
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon icon="solar:close-circle-linear" className="w-7 h-7" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    Leave Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['vacation', 'sick', 'half-day', 'personal'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          'px-3 py-2 border font-mono text-[10px] uppercase tracking-wider text-center transition-all',
                          type === t
                            ? 'bg-primary/10 border-primary text-primary shadow-[inset_0_0_10px_rgba(0,255,136,0.1)]'
                            : 'border-border text-muted-foreground hover:bg-muted/30'
                        )}
                      >
                        {t.replace('-', '_')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    Effective Date
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-muted/30 border-border h-12 font-mono text-sm focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    Justification / Mission Notes
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly explain the rationale for leave..."
                    className="bg-muted/30 border-border min-h-[100px] font-mono text-sm focus-visible:ring-primary/20 resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 font-mono text-xs uppercase tracking-widest"
                    onClick={onClose}
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    className="flex-1 h-12 font-mono text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                    disabled={isPending}
                  >
                    {isPending ? 'Syncing...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
