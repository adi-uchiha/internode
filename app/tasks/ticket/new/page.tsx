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
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import { useCreateTicket } from '@/hooks/useTickets';
import { toast } from 'sonner';

export default function NewTicketPage() {
  const router = useRouter();
  const { user, orgRole } = useAuth();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [estimate, setEstimate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [labels, setLabels] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const { mutateAsync: createTicket, isPending: isCreating } = useCreateTicket();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- safe hydration guard
    setMounted(true);
    if (!isAdmin && user) {
      toast.error('Unauthorized access');
      router.push('/tasks/dashboard');
    }
  }, [isAdmin, user, router]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (projectIds.length === 0) {
      toast.error('At least one project is required');
      return;
    }

    try {
      await createTicket({
        title,
        description,
        projectIds,
        assigneeId: assigneeId || null,
        priority: priority as 'critical' | 'high' | 'medium' | 'low',
        estimatedHours: parseFloat(estimate) || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
      } as Record<string, unknown>);
      toast.success(`Ticket "${title}" initialized successfully`);
      router.push('/tasks/kanban');
    } catch (err) {
      toast.error('Failed to initialize ticket');
      console.error(err);
    }
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
                <div className="flex flex-wrap gap-2">
                  {projects?.map((p) => {
                    const isSelected = projectIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setProjectIds((prev) =>
                            isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          )
                        }
                        className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                          isSelected
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                  {(!projects || projects.length === 0) && (
                    <span className="font-mono text-xs text-muted-foreground">
                      No projects available
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  Assignee
                </label>
                <Select value={assigneeId} onValueChange={(val) => setAssigneeId(val || '')}>
                  <SelectTrigger className="bg-muted/30 border-border h-10">
                    <SelectValue placeholder="Select member">
                      {users?.find((m) => m.id === assigneeId)?.name ||
                        users?.find((m) => m.id === assigneeId)?.email}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name || m.email} ({m.role})
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
                    <SelectValue>
                      {priority === 'critical' && '🔴 Critical'}
                      {priority === 'high' && '🟡 High'}
                      {priority === 'medium' && '🔵 Medium'}
                      {priority === 'low' && '⚪ Low'}
                    </SelectValue>
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
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                  Technical Description
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 font-mono text-[9px] text-muted-foreground hover:text-primary transition-colors px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(description);
                    toast.success('Markdown copied to clipboard');
                  }}
                >
                  <Icon icon="solar:copy-linear" className="w-3 h-3 mr-1.5" />
                  Copy Markdown
                </Button>
              </div>
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
              disabled={!title.trim() || projectIds.length === 0 || isCreating}
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
