'use client';

import { use, useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getTimeBarColor,
  type TicketStatus,
  type TicketPriority,
} from '@/lib/ticket-utils';
import {
  useTicket,
  useUpdateTicket,
  useLogTime,
  useTicketComments,
  useCreateComment,
} from '@/hooks/useTickets';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

interface EditForm {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  projectId?: string;
  assigneeId?: string | null;
  estimatedHours?: number;
  dueDate?: Date | null;
  labels?: string[];
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ticketUrlId } = use(params);
  const router = useRouter();
  const { orgRole } = useAuth();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  const { data: ticket, isLoading } = useTicket(ticketUrlId);
  const { mutateAsync: updateTicket } = useUpdateTicket();
  const { mutateAsync: logTime } = useLogTime();
  const { data: commentsList } = useTicketComments(ticket?.id || '');
  const { mutateAsync: createComment } = useCreateComment();
  const { data: projects } = useProjects();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({});
  const [showLogTime, setShowLogTime] = useState(false);
  const [logHours, setLogHours] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logBreakthrough, setLogBreakthrough] = useState(false);
  const [commentText, setCommentText] = useState('');

  const [now] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- safe hydration guard
  useEffect(() => setMounted(true), []);

  const isOverdue = useMemo(() => {
    if (!ticket) return false;
    return ticket.dueDate && new Date(ticket.dueDate) < now && ticket.status !== 'done';
  }, [ticket, now]);

  if (isLoading) {
    return (
      <div className="p-20 text-center text-muted-foreground animate-pulse">
        Retrieving Ticket Database...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Icon icon="solar:document-text-linear" className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Ticket not found</h2>
        <p className="text-muted-foreground mb-6">The ticket you're looking for doesn't exist.</p>
        <Button variant="hero" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const pct =
    (ticket.estimatedHours || 0) > 0
      ? ((ticket.loggedHours || 0) / (ticket.estimatedHours || 1)) * 100
      : 0;
  const variance =
    (ticket.estimatedHours || 0) > 0
      ? (
          (((ticket.loggedHours || 0) - (ticket.estimatedHours || 0)) /
            (ticket.estimatedHours || 1)) *
          100
        ).toFixed(1)
      : '0';
  const isOverBudget = (ticket.loggedHours || 0) > (ticket.estimatedHours || 0);

  const startEdit = () => {
    setEditForm({
      title: ticket.title,
      description: ticket.description ?? undefined,
      status: ticket.status,
      priority: ticket.priority,
      projectId: ticket.projectId ?? undefined,
      assigneeId: ticket.assigneeId ?? undefined,
      estimatedHours: ticket.estimatedHours ?? undefined,
      dueDate: ticket.dueDate,
      labels: [...(ticket.labels || [])],
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    try {
      await updateTicket({ id: ticket.id, ...editForm });
      setIsEditing(false);
      toast.success('Ticket updated successfully');
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleLogTime = async () => {
    if (!logHours || parseFloat(logHours) <= 0) return;
    try {
      await logTime({
        id: ticket.id,
        hours: parseFloat(logHours),
        note: logNote || 'Time logged',
        isBreakthrough: logBreakthrough,
        date: new Date().toISOString(),
      });
      setShowLogTime(false);
      setLogHours('');
      setLogNote('');
      setLogBreakthrough(false);
      toast.success(`Logged ${logHours}h successfully`);
    } catch {
      toast.error('Failed to log time');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment({ ticketId: ticket.id, content: commentText });
      setCommentText('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await updateTicket({ id: ticket.id, status: newStatus });
      toast.success(`Status changed to ${getStatusLabel(newStatus)}`);
    } catch {
      toast.error('Failed to change status');
    }
  };

  const handleDuplicate = () => {
    toast.success('Ticket duplicated (local only)');
  };

  const handleArchive = () => {
    toast.success('Ticket archived (local only)');
    router.back();
  };

  const handleDelete = () => {
    toast.success('Ticket deleted (local only)');
    router.back();
  };

  return (
    <div className="w-full">
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-card/30 p-4 border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8">
            <Icon icon="solar:arrow-left-linear" className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <div className="h-4 w-px bg-border mx-1 hidden md:block" />
          <span className="font-mono text-[11px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 tracking-widest font-bold uppercase">
            {ticket.ticketId}
          </span>
          <span
            className={cn(
              'font-mono text-[10px] uppercase px-2.5 py-0.5 rounded-sm',
              getStatusColor(ticket.status)
            )}
          >
            {getStatusLabel(ticket.status)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !isEditing && (
            <Button variant="outline" size="sm" onClick={startEdit} className="h-8">
              <Icon icon="solar:pen-linear" className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8">
                Cancel
              </Button>
              <Button variant="hero" size="sm" onClick={saveEdit} className="h-8">
                <Icon icon="solar:check-circle-linear" className="w-4 h-4 mr-1.5" />
                Save
              </Button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="secondary" size="sm" className="h-8">
                  <Icon icon="solar:menu-dots-bold" className="w-4 h-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 border-border shadow-xl">
              <DropdownMenuItem onClick={() => setShowLogTime(true)} className="cursor-pointer">
                <Icon icon="solar:clock-circle-linear" className="w-4 h-4 mr-2" />
                Log Time
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2" /> To-Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in-progress')}>
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in-review')}>
                <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" /> In Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                <div className="w-2 h-2 rounded-full bg-primary mr-2" /> Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
                <Icon icon="solar:copy-linear" className="w-4 h-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={handleArchive} className="cursor-pointer">
                    <Icon icon="solar:archive-linear" className="w-4 h-4 mr-2" /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-4 space-y-8">
          {/* Header Card */}
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-2">
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                  {ticket.ticketId}
                </div>
                <Input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="font-display text-3xl font-bold bg-muted/30 border-border h-auto py-3 px-4 focus-visible:ring-primary/30"
                />
              </div>
            ) : (
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
                <span className="text-primary mr-3 font-mono text-2xl font-extrabold tracking-widest">
                  {ticket.ticketId}
                </span>
                {ticket.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-6 py-2 border-y border-border/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Assignee
                </span>
                <div className="flex items-center gap-2 px-2 py-1 bg-muted/20 border border-border rounded-full">
                  {ticket.assignee?.image ? (
                    <Image
                      src={ticket.assignee.image}
                      alt={ticket.assignee.name || ''}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  ) : (
                    <Icon icon="solar:user-linear" className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium">
                    {ticket.assignee?.name || 'Unassigned'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Priority
                </span>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/20 border border-border rounded-full">
                  <div
                    className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority || 'medium')}`}
                  />
                  <span className="text-xs font-medium capitalize">{ticket.priority}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Project
                </span>
                <span className="text-xs font-bold text-primary">
                  {ticket.project?.name || 'Generic'}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="solar:align-left-linear" className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-semibold tracking-tight">Description</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  const content = isEditing ? editForm.description || '' : ticket.description || '';
                  navigator.clipboard.writeText(content);
                  toast.success('Markdown copied to clipboard');
                }}
              >
                <Icon icon="solar:copy-linear" className="w-3.5 h-3.5 mr-1.5" />
                Copy Markdown
              </Button>
            </div>
            {isEditing ? (
              <MarkdownEditor
                value={editForm.description || ''}
                onChange={(val) => setEditForm({ ...editForm, description: val })}
                minHeight="400px"
              />
            ) : (
              <div className="border border-border/50 bg-card p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                <MarkdownRenderer content={ticket.description || ''} />
              </div>
            )}
          </div>

          {/* Time Tracking HUD */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="solar:clock-circle-linear" className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-semibold tracking-tight">Time Logs</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogTime(true)}
                className="h-8 font-mono text-xs border-primary/20 text-primary hover:bg-primary/10"
              >
                + Log Progress
              </Button>
            </div>
            <div className="border border-border bg-card p-6 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1">
                    <span>{ticket.loggedHours}h logged ── HUD</span>
                    <span>
                      {pct.toFixed(0)}% of {ticket.estimatedHours}h estimate
                    </span>
                  </div>
                  <div className="h-3 bg-muted/30 border border-border overflow-hidden rounded-full p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${getTimeBarColor(
                        ticket.loggedHours,
                        ticket.estimatedHours
                      )}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center p-4 bg-muted/10 border border-border min-w-[140px]">
                  <div className="text-center">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase mb-1">
                      Variance
                    </div>
                    <div
                      className={cn(
                        'font-display text-2xl font-bold',
                        isOverBudget ? 'text-destructive' : 'text-primary'
                      )}
                    >
                      {isOverBudget ? '+' : ''}
                      {variance}%
                    </div>
                  </div>
                </div>
              </div>

              {(ticket.timeLogs || []).length > 0 ? (
                <div className="space-y-2">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3 opacity-50">
                    ── Activity Log ──
                  </div>
                  {(ticket.timeLogs || []).map((log) => {
                    return (
                      <div
                        key={log.id}
                        className={cn(
                          'flex items-center gap-4 p-4 border border-border bg-card/50 transition-all hover:bg-card',
                          log.isBreakthrough &&
                            'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                        )}
                      >
                        {log.user?.image ? (
                          <Image
                            src={log.user.image}
                            alt={log.user.name || ''}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full border border-border object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border border-border">
                            <Icon
                              icon="solar:user-linear"
                              className="w-3 h-3 text-muted-foreground"
                            />
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {log.hours.toFixed(1)}h
                          </span>
                          <span className="text-sm text-foreground truncate md:col-span-2">
                            {log.note}
                          </span>
                        </div>
                        {log.isBreakthrough && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-sm">
                            <Icon icon="solar:star-bold" className="w-3 h-3 text-primary" />
                            <span className="font-mono text-[9px] text-primary font-bold uppercase">
                              Prog
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 opacity-30">
                  <Icon icon="solar:history-linear" className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-mono text-xs">No activity logged yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Communication Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon icon="solar:chat-round-dots-linear" className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Activity & Comments ({(commentsList || []).length})
              </h2>
            </div>
            <div className="space-y-3">
              {(commentsList || []).map((c) => {
                return (
                  <div
                    key={c.id}
                    className="flex gap-4 border border-border bg-card/80 p-5 shadow-sm group"
                  >
                    {c.user?.image ? (
                      <Image
                        src={c.user.image}
                        alt={c.user.name || ''}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border border-border shrink-0 group-hover:border-primary/50 transition-colors object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border shrink-0 group-hover:border-primary/50 transition-colors">
                        <Icon icon="solar:user-bold" className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{c.user?.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <MarkdownRenderer content={c.content} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {(commentsList || []).length === 0 && (
                <div className="text-center py-12 border border-dashed border-border bg-card/30">
                  <Icon
                    icon="solar:bubble-chat-linear"
                    className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20"
                  />
                  <p className="font-mono text-xs text-muted-foreground">
                    Initial status: No discussion history.
                  </p>
                </div>
              )}
            </div>

            {/* Comment Input HUD */}
            <div className="mt-6 border border-border bg-card p-6 shadow-lg ring-1 ring-primary/5">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Submit technical update... (Markdown supported)"
                className="min-h-[120px] bg-muted/20 border-border font-mono text-sm resize-none mb-4 focus-visible:ring-primary/20"
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Icon icon="solar:text-italic-bold" className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase opacity-50">
                    Terminal ready
                  </span>
                </div>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-6"
                >
                  <Icon icon="solar:plain-linear" className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Metadata & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-6 sticky top-24">
            {/* Meta Card */}
            <div className="border border-border bg-card p-6 space-y-6 shadow-sm">
              <div className="font-mono text-[11px] text-primary uppercase tracking-widest font-bold">
                ── Technical Metadata
              </div>

              <div className="space-y-5">
                {/* Status Selection */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                    Lifecycle Status
                  </span>
                  {isEditing ? (
                    <Select
                      value={editForm.status}
                      onValueChange={(val) =>
                        setEditForm({ ...editForm, status: (val || 'todo') as TicketStatus })
                      }
                    >
                      <SelectTrigger className="bg-muted/50 border-border h-9">
                        <SelectValue>
                          {editForm.status && getStatusLabel(editForm.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unplanned">Unplanned</SelectItem>
                        <SelectItem value="todo">To-Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="in-review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span
                        className={cn(
                          'font-mono text-xs uppercase px-3 py-1 rounded-sm border w-full text-center',
                          getStatusColor(ticket.status)
                        )}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                    Execution Priority
                  </span>
                  {isEditing ? (
                    <Select
                      value={editForm.priority}
                      onValueChange={(val) =>
                        setEditForm({ ...editForm, priority: (val || 'low') as TicketPriority })
                      }
                    >
                      <SelectTrigger className="bg-muted/50 border-border h-9">
                        <SelectValue>
                          {editForm.priority === 'critical' && '🔴 Critical'}
                          {editForm.priority === 'high' && '🟡 High'}
                          {editForm.priority === 'medium' && '🔵 Medium'}
                          {editForm.priority === 'low' && '⚪ Low'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                        <SelectItem value="high">🟡 High</SelectItem>
                        <SelectItem value="medium">🔵 Medium</SelectItem>
                        <SelectItem value="low">⚪ Low</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted/20 border border-border">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(ticket.priority)}`}
                      />
                      <span className="text-sm font-medium capitalize">{ticket.priority}</span>
                    </div>
                  )}
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                    System / Project
                  </span>
                  {isEditing ? (
                    <Select
                      value={editForm.projectId || ''}
                      onValueChange={(val) => setEditForm({ ...editForm, projectId: val || '' })}
                    >
                      <SelectTrigger className="bg-muted/50 border-border h-9">
                        <SelectValue>
                          {(projects || []).find((p) => p.id === editForm.projectId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(projects || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm font-mono bg-primary/5 text-primary border border-primary/20 p-2 text-center">
                      {ticket.project?.name || 'GENERIC'}
                    </div>
                  )}
                </div>

                {/* Estimate */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                    Projected Duration
                  </span>
                  {isEditing ? (
                    <div className="relative">
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={editForm.estimatedHours || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, estimatedHours: parseFloat(e.target.value) })
                        }
                        className="bg-muted/50 border-border h-9 pr-12 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
                        HOURS
                      </span>
                    </div>
                  ) : (
                    <div className="text-lg font-display font-bold">{ticket.estimatedHours}h</div>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                    Release / Deadline
                  </span>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={
                        editForm.dueDate instanceof Date
                          ? editForm.dueDate.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          dueDate: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                      className="bg-muted/50 border-border h-9 font-mono"
                    />
                  ) : (
                    <div
                      className={cn(
                        'text-sm font-mono',
                        isOverdue && mounted ? 'text-destructive font-bold' : 'text-foreground'
                      )}
                    >
                      {ticket.dueDate
                        ? mounted
                          ? new Date(ticket.dueDate).toLocaleDateString()
                          : 'LOADING...'
                        : '∞ UNSCHEDULED'}
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                    Classification Labels
                  </span>
                  {isEditing ? (
                    <Input
                      value={(editForm.labels || []).join(', ')}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          labels: e.target.value
                            .split(',')
                            .map((l) => l.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="e.g. core, hotfix, ui"
                      className="bg-muted/50 border-border h-9 font-mono text-xs"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(ticket.labels || []).map((l) => (
                        <span
                          key={l}
                          className="font-mono text-[9px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ownership */}
              <div className="pt-6 border-t border-border/50 space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] text-muted-foreground uppercase">
                    Author
                  </span>
                  <div className="flex items-center gap-2">
                    {ticket.createdBy?.image ? (
                      <Image
                        src={ticket.createdBy.image}
                        alt={ticket.createdBy.name || ''}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <Icon icon="solar:user-linear" className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium">
                      {ticket.createdBy?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] text-muted-foreground uppercase">
                    Created
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-primary/5 border border-primary/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Icon icon="solar:shield-warning-linear" className="w-4 h-4" />
                <span className="font-mono text-[10px] font-bold uppercase">System Advisory</span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                Persistent shifts in time logs or scope changes require administrative sign-off.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Time Dialog HUD */}
      <Dialog open={showLogTime} onOpenChange={setShowLogTime}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-md p-0 overflow-hidden">
          <div className="bg-primary h-1 w-full" />
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-display text-2xl font-bold tracking-tight">
                Log Technical Session
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono">
                TRACKING SESSION FOR: {ticket.id}
              </p>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  Duration (Hours)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    placeholder="2.0"
                    className="bg-muted/30 border-border h-12 font-mono text-lg focus:ring-primary/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                    HRS
                  </span>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                  Session Work Log
                </label>
                <Textarea
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="Summary of findings and implementation..."
                  className="bg-muted/30 border-border font-mono text-sm min-h-[120px] resize-none focus:ring-primary/20"
                />
              </div>
              <label
                className={cn(
                  'flex items-center justify-between p-4 border transition-all cursor-pointer group',
                  logBreakthrough
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                    : 'bg-muted/20 border-border hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn('p-2 rounded-sm', logBreakthrough ? 'bg-primary/20' : 'bg-muted')}
                  >
                    <Icon
                      icon={logBreakthrough ? 'solar:star-bold' : 'solar:star-linear'}
                      className={cn(
                        'w-5 h-5',
                        logBreakthrough ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div>
                    <span className="font-display font-medium text-sm block">
                      System Breakthrough
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground uppercase">
                      Significant technical milestone
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={logBreakthrough}
                  onChange={() => setLogBreakthrough(!logBreakthrough)}
                  className="hidden"
                />
                <div
                  className={cn(
                    'w-5 h-5 border flex items-center justify-center transition-colors',
                    logBreakthrough ? 'bg-primary border-primary' : 'border-border bg-card'
                  )}
                >
                  {logBreakthrough && (
                    <Icon icon="solar:check-linear" className="w-4 h-4 text-white" />
                  )}
                </div>
              </label>
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setShowLogTime(false)} className="flex-1">
                  Abort
                </Button>
                <Button
                  variant="hero"
                  onClick={handleLogTime}
                  disabled={!logHours || parseFloat(logHours) <= 0}
                  className="flex-1"
                >
                  Commit Log
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
