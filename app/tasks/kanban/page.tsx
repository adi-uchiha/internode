'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  tmTickets,
  tmProjects,
  getMemberById,
  getPriorityColor,
  getTimeBarColor,
  type TTicket,
  type TicketStatus,
} from '@/data/taskManagerData';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const columns: { status: TicketStatus; label: string; color: string }[] = [
  {
    status: 'unplanned',
    label: 'BACKLOG',
    color: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  },
  {
    status: 'todo',
    label: 'TO-DO',
    color: 'border-muted-foreground/30 text-muted-foreground bg-muted/20 text-foreground',
  },
  {
    status: 'in-progress',
    label: 'IN PROGRESS',
    color: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  },
  {
    status: 'in-review',
    label: 'IN REVIEW',
    color: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  },
  { status: 'done', label: 'DONE', color: 'border-primary/30 text-primary bg-primary/10' },
];

const KanbanCard = ({
  ticket,
  onClick,
  mounted = false,
}: {
  ticket: TTicket;
  onClick: () => void;
  mounted?: boolean;
}) => {
  const assignee = getMemberById(ticket.assigneeId);
  const pct = ticket.estimatedHours > 0 ? (ticket.loggedHours / ticket.estimatedHours) * 100 : 0;
  const now = new Date();

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01, borderColor: 'hsl(var(--primary) / 0.5)' }}
      onClick={onClick}
      className="border border-border bg-card p-4 cursor-pointer transition-all active:scale-95"
      draggable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragStart={(e: any) => {
        e.dataTransfer.setData('ticketId', ticket.id);
        e.dataTransfer.dropEffect = 'move';
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-2 h-2 rounded-full', getPriorityColor(ticket.priority))} />
        <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 uppercase tracking-wider">
          {ticket.project}
        </span>
      </div>
      <h4 className="font-display text-sm font-medium mb-3 line-clamp-2 leading-tight">
        {ticket.title}
      </h4>
      {ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {ticket.labels.slice(0, 3).map((l) => (
            <span
              key={l}
              className="font-mono text-[8.5px] text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/10"
            >
              {l}
            </span>
          ))}
          {ticket.labels.length > 3 && (
            <span className="font-mono text-[9px] text-muted-foreground ml-1">
              +{ticket.labels.length - 3}
            </span>
          )}
        </div>
      )}
      <div className="mb-3 space-y-1">
        <div className="h-0.5 bg-muted overflow-hidden w-full">
          <div
            className={cn(
              'h-full transition-all duration-500',
              getTimeBarColor(ticket.loggedHours, ticket.estimatedHours)
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex justify-between items-center font-mono text-[9px] text-muted-foreground">
          <span>
            {ticket.loggedHours}h / {ticket.estimatedHours}h
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex -space-x-2">
          <img
            src={assignee?.avatar}
            alt=""
            className="w-5 h-5 rounded-full border border-background ring-1 ring-border"
          />
        </div>
        {ticket.dueDate && mounted && (
          <span
            className={cn(
              'font-mono text-[9px]',
              new Date(ticket.dueDate) < now && ticket.status !== 'done'
                ? 'text-destructive font-bold'
                : 'text-muted-foreground'
            )}
          >
            {ticket.dueDate.slice(5)}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default function KanbanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const [tickets, setTickets] = useState(tmTickets);
  const [filter, setFilter] = useState({ priority: 'all', project: 'all', search: '' });
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- safe hydration guard
  useEffect(() => setMounted(true), []);

  const filteredTickets = tickets.filter((t) => {
    if (filter.priority !== 'all' && t.priority !== filter.priority) return false;
    if (filter.project !== 'all' && t.project !== filter.project) return false;
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const handleDrop = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const ticketId = e.dataTransfer.getData('ticketId');
    if (!ticketId) return;

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    toast.success(`Ticket moved to ${status.toUpperCase()}`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] border border-border bg-card/50 px-3 h-10 focus-within:border-primary/50 transition-colors">
          <Icon icon="solar:magnifer-linear" className="w-4 h-4 text-muted-foreground" />
          <input
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            placeholder="Search tickets..."
            className="bg-transparent font-display text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>

        <Select
          value={filter.priority}
          onValueChange={(val) => setFilter({ ...filter, priority: val || '' })}
        >
          <SelectTrigger className="w-[140px] bg-card/50 border-border h-10 font-display text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="font-display">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.project}
          onValueChange={(val) => setFilter({ ...filter, project: val || '' })}
        >
          <SelectTrigger className="w-[150px] bg-card/50 border-border h-10 font-display text-sm">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="font-display">
            <SelectItem value="all">All Projects</SelectItem>
            {tmProjects.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Button
            variant="hero"
            className="h-10 px-6"
            onClick={() => router.push('/tasks/ticket/new')}
          >
            <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Board Scroll Area */}
      <div className="overflow-x-auto pb-6 -mx-2 px-2">
        <div className="flex gap-4 min-w-max h-[calc(100vh-220px)]">
          {columns.map((col) => {
            const colTickets = filteredTickets.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className={cn(
                  'w-[300px] flex flex-col transition-all duration-200',
                  dragOverColumn === col.status && 'bg-primary/5 ring-1 ring-primary/20 ring-inset'
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(col.status);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                <div
                  className={cn(
                    'border-t-2 border-x border-border p-4 flex items-center justify-between',
                    col.color
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[11px] font-bold uppercase tracking-widest">
                      {col.label}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-70">[{colTickets.length}]</span>
                </div>

                <div className="flex-1 border-x border-b border-border bg-card/10 overflow-y-auto p-3 space-y-3 scrollbar-none">
                  <AnimatePresence>
                    {colTickets.map((ticket) => (
                      <KanbanCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => router.push(`/tasks/ticket/${ticket.id}`)}
                        mounted={mounted}
                      />
                    ))}
                  </AnimatePresence>

                  {col.status === 'todo' && isAdmin && (
                    <button
                      onClick={() => router.push('/tasks/ticket/new')}
                      className="w-full border border-dashed border-border py-4 text-center font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-all bg-card/5 hover:bg-primary/5"
                    >
                      + INITIALIZE TICKET
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
