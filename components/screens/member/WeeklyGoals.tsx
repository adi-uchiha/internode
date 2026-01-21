'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockWeeklyGoals } from '@/data/mockData';

const WeeklyGoals = () => {
  const [goals, setGoals] = useState(mockWeeklyGoals[0]?.goals || []);
  const [newGoal, setNewGoal] = useState('');

  const addGoal = () => {
    if (newGoal.trim() && goals.length < 5) {
      setGoals([...goals, { id: `g${Date.now()}`, text: newGoal, completed: false }]);
      setNewGoal('');
    }
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progressPercentage = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  // Get current week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <MemberLayout title="Weekly Goals">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                [WEEKLY_GOALS]
              </div>
              <h1 className="text-xl font-display font-semibold">
                {formatDate(startOfWeek)} - {formatDate(endOfWeek)}
              </h1>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-bold text-primary">
                {completedCount}/{goals.length}
              </div>
              <div className="font-mono text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-primary"
            />
          </div>
        </motion.div>

        {/* Goals List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border bg-card p-4 flex items-center gap-4 group transition-all ${
                goal.completed ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
            >
              <button
                onClick={() => toggleGoal(goal.id)}
                className={`w-6 h-6 border shrink-0 flex items-center justify-center transition-all ${
                  goal.completed
                    ? 'bg-primary border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {goal.completed && (
                  <Icon icon="solar:check-linear" className="w-4 h-4 text-primary-foreground" />
                )}
              </button>

              <span
                className={`font-mono text-sm flex-1 ${
                  goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                {goal.text}
              </span>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="p-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Icon icon="solar:trash-bin-minimalistic-linear" className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {goals.length === 0 && (
            <div className="border border-dashed border-border p-8 text-center">
              <Icon
                icon="solar:target-linear"
                className="w-12 h-12 text-muted-foreground mx-auto mb-4"
              />
              <p className="font-mono text-muted-foreground">No goals set for this week yet.</p>
            </div>
          )}
        </motion.div>

        {/* Add Goal */}
        {goals.length < 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="border border-border bg-card p-4"
          >
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">
              [ADD_GOAL] - Max 5 goals per week
            </div>
            <div className="flex gap-3">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                placeholder="Enter a new goal..."
                className="flex-1 bg-background border-border font-mono"
              />
              <Button onClick={addGoal} variant="hero" disabled={!newGoal.trim()}>
                <Icon icon="solar:add-linear" className="w-4 h-4" />
                Add Goal
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border border-border bg-card p-6"
        >
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-4">
            [TIPS]
          </div>
          <ul className="space-y-2 font-mono text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4 text-primary mt-0.5" />
              <span>Keep goals specific and measurable</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4 text-primary mt-0.5" />
              <span>Limit to 3-5 high-impact goals per week</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4 text-primary mt-0.5" />
              <span>Check off goals as you complete them in your daily logs</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </MemberLayout>
  );
};

export default WeeklyGoals;
