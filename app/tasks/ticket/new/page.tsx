'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tmMembers, tmProjects } from '@/data/taskManagerData';
import { toast } from 'sonner';

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [assignee, setAssignee] = useState('');
  const [estimate, setEstimate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [labels, setLabels] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- safe hydration guard
    setMounted(true);
    if (!isAdmin && user) {
      toast.error('Unauthorized access');
      router.push('/tasks/dashboard');
    }
  }, [isAdmin, user, router]);

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    toast.success(`Ticket "${title}" created (local only)`);
    router.push('/tasks/kanban');
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8">
            <Icon icon="solar:arrow-left-linear" className="w-4 h-4 mr-1.5" />
            Back to Kanban
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-widest">
            Create New Ticket
          </h1>
        </div>

        <div className="border border-border bg-card p-8 shadow-xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-primary uppercase tracking-widest block mb-2 font-bold">
                ── Ticket Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="font-display text-xl font-semibold bg-muted/30 border-border h-auto py-3 px-4 focus-visible:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  System / Project
                </label>
                <Select value={project} onValueChange={(val) => setProject(val || '')}>
                  <SelectTrigger className="bg-muted/30 border-border h-10">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {tmProjects.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  Assignee
                </label>
                <Select value={assignee} onValueChange={(val) => setAssignee(val || '')}>
                  <SelectTrigger className="bg-muted/30 border-border h-10">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {tmMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  Priority
                </label>
                <Select value={priority} onValueChange={(val) => setPriority(val || '')}>
                  <SelectTrigger className="bg-muted/30 border-border h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                    <SelectItem value="high">🟡 High</SelectItem>
                    <SelectItem value="medium">🔵 Medium</SelectItem>
                    <SelectItem value="low">⚪ Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  Time Estimate
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                    placeholder="4.5"
                    className="bg-muted/30 border-border h-10 pr-14 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
                    HOURS
                  </span>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-muted/30 border-border h-10 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Classification Labels
              </label>
              <Input
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="auth, bug, frontend... (comma separated)"
                className="bg-muted/30 border-border h-10 font-mono text-xs"
              />
            </div>

            <div className="pt-4 border-t border-border/50">
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Technical Description
              </label>
              <MarkdownEditor value={description} onChange={setDescription} minHeight="350px" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              variant="hero"
              size="lg"
              className="px-8 shadow-lg shadow-primary/20"
              onClick={handleCreate}
              disabled={!title.trim()}
            >
              <Icon icon="solar:check-circle-linear" className="w-5 h-5 mr-2" />
              Initialize Ticket
            </Button>
          </div>
        </div>

        {/* Advisory Box */}
        <div className="bg-primary/5 border border-primary/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Icon icon="solar:shield-warning-linear" className="w-4 h-4" />
            <span className="font-mono text-[10px] font-bold uppercase">System Advisory</span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            All tickets initiated are tracked for system contribution efficiency. Ensure the
            estimate aligns with technical complexity.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
