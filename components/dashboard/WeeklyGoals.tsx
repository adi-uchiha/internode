'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useGoals, useAddGoalItem, useUpdateGoalItem, useDeleteGoalItem } from '@/hooks/useGoals';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

export function WeeklyGoals() {
  const [newGoal, setNewGoal] = useState('');
  const { data: goal, isLoading } = useGoals();
  const { mutateAsync: addGoal, isPending: isAdding } = useAddGoalItem();
  const { mutateAsync: updateGoal } = useUpdateGoalItem();
  const { mutateAsync: deleteGoal } = useDeleteGoalItem();

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim() || !goal) return;

    try {
      await addGoal({ weeklyGoalId: goal.id, text: newGoal.trim() });
      setNewGoal('');
      toast.success('Objective committed to registry');
    } catch {
      toast.error('Failed to commit objective');
    }
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    try {
      await updateGoal({ id, completed });
    } catch {
      toast.error('Sync failed');
    }
  };

  if (isLoading) {
    return <div className="h-48 border border-border bg-card/50 animate-pulse" />;
  }

  const completedCount = goal?.items.filter((i) => i.completed).length || 0;
  const totalCount = goal?.items.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="border border-border bg-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          [WEEKLY_OBJECTIVES]
        </div>
        <div className="font-mono text-[10px] text-primary">
          {completedCount}/{totalCount} DONE
        </div>
      </div>

      <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
        Focus Protocol
        <span className="text-xs font-mono font-normal text-muted-foreground opacity-50">
          W{new Date().getTime().toString().slice(-2)}
        </span>
      </h3>

      <div className="mb-6 space-y-2">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-6 overflow-y-auto max-h-[200px] pr-2 scrollbar-thin scrollbar-thumb-border">
        <AnimatePresence mode="popLayout">
          {goal?.items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 group"
            >
              <button
                onClick={() => toggleGoal(item.id, !item.completed)}
                className={cn(
                  'w-5 h-5 border transition-all flex items-center justify-center shrink-0',
                  item.completed
                    ? 'bg-primary border-primary text-background'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {item.completed && <Icon icon="solar:check-read-linear" className="w-3 h-3" />}
              </button>
              <span
                className={cn(
                  'text-sm flex-1 transition-all truncate',
                  item.completed
                    ? 'text-muted-foreground line-through opacity-50'
                    : 'text-foreground'
                )}
              >
                {item.text}
              </span>
              <button
                onClick={() => deleteGoal(item.id)}
                className="opacity-0 group-hover:opacity-100 text-destructive hover:scale-110 transition-all"
              >
                <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {totalCount === 0 && (
          <div className="text-center py-8 opacity-20 filter grayscale">
            <Icon icon="solar:target-linear" className="w-12 h-12 mx-auto mb-2" />
            <p className="font-mono text-[10px] uppercase tracking-tighter">
              No objectives defined
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleAddGoal} className="mt-auto relative">
        <Input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="Define new objective..."
          className="bg-muted/30 border-border h-10 font-mono text-xs pr-10 focus-visible:ring-primary/20"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={isAdding || !newGoal.trim()}
          className="absolute right-2 top-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
        >
          <Icon icon="solar:add-circle-linear" className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
}
