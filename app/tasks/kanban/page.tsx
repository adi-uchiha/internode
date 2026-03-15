'use client';

import React, { useState } from 'react';
import { useIsMounted } from '@/hooks/use-mounted';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';

import { getPriorityColor, getTimeBarColor, type TicketPriority } from '@/lib/ticket-utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useTickets, useUpdateTicket } from '@/hooks/useTickets';
import { useProjects } from '@/hooks/useProjects';
import type { TicketWithRelations } from '@/hooks/useTickets';

const columns: {
  status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'unplanned';
  label: string;
  color: string;
}[] = [
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
  isMounted,
}: {
  ticket: TicketWithRelations;
  onClick: () => void;
  isMounted?: boolean;
}) => {
  const pct =
    ticket.estimatedHours && ticket.estimatedHours > 0
      ? ((ticket.loggedHours || 0) / ticket.estimatedHours) * 100
      : 0;
  const now = new Date();

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01, borderColor: 'hsl(var(--primary) / 0.5)' }}
      onClick={onClick}
      className="border border-border bg-card p-4 cursor-pointer transition-all active:scale-95"
      draggable
      onDragStartCapture={(e: React.DragEvent) => {
        e.dataTransfer.setData('ticketDbId', ticket.id);
        e.dataTransfer.dropEffect = 'move';
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            getPriorityColor((ticket.priority as TicketPriority) || 'medium')
          )}
        />
        <span className="font-mono text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 uppercase tracking-wider">
          {ticket.ticketId}
        </span>
        {(ticket.projects || []).length > 0 ? (
          <>
            <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 uppercase tracking-wider">
              {ticket.projects![0].name}
            </span>
            {ticket.projects!.length > 1 && (
              <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1 py-0.5">
                +{ticket.projects!.length - 1}
              </span>
            )}
          </>
        ) : (
          <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 uppercase tracking-wider">
            GENERIC
          </span>
        )}
      </div>
      <h4 className="font-display text-sm font-medium mb-3 line-clamp-2 leading-tight">
        <span className="text-muted-foreground mr-1.5">{ticket.ticketId}</span>
        {ticket.title}
      </h4>
      {(ticket.labels || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {ticket.labels!.slice(0, 3).map((l) => (
            <span
              key={l}
              className="font-mono text-[8.5px] text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/10"
            >
              {l}
            </span>
          ))}
          {ticket.labels!.length > 3 && (
            <span className="font-mono text-[9px] text-muted-foreground ml-1">
              +{ticket.labels!.length - 3}
            </span>
          )}
        </div>
      )}
      <div className="mb-3 space-y-1">
        <div className="h-0.5 bg-muted overflow-hidden w-full">
          <div
            className={cn(
              'h-full transition-all duration-500',
              getTimeBarColor(ticket.loggedHours || 0, ticket.estimatedHours || 0)
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="flex justify-between items-center font-mono text-[9px] text-muted-foreground">
          <span>
            {ticket.loggedHours || 0}h / {ticket.estimatedHours || 0}h
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex -space-x-2">
          {ticket.assignee?.image ? (
            <Image
              src={ticket.assignee.image}
              alt={ticket.assignee.name || 'User'}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full border border-background ring-1 ring-border object-cover bg-muted"
            />
          ) : (
            <div className="w-5 h-5 rounded-full border border-background ring-1 ring-border bg-muted flex items-center justify-center">
              <Icon icon="solar:user-linear" className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>
        {ticket.dueDate && isMounted && (
          <span
            className={cn(
              'font-mono text-[9px]',
              new Date(ticket.dueDate) < now && ticket.status !== 'done'
                ? 'text-destructive font-bold'
                : 'text-muted-foreground'
            )}
          >
            {new Date(ticket.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default function KanbanPage() {
  const { orgRole } = useAuth();
  const router = useRouter();
  const isAdmin = orgRole === 'admin' || orgRole === 'owner';
  const { data: ticketsResponse, isLoading } = useTickets();
  const { data: projectsResponse } = useProjects();
  const { mutateAsync: updateTicket } = useUpdateTicket();

  const [filter, setFilter] = useState({ priority: 'all', project: 'all', search: '' });
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const isMounted = useIsMounted();
  const scrollRef = useHorizontalScroll<HTMLDivElement>();

  const tickets = ticketsResponse || [];

  const filteredTickets = tickets.filter((t) => {
    if (filter.priority !== 'all' && t.priority !== filter.priority) return false;
    if (filter.project !== 'all' && !(t.projects || []).some((p) => p.name === filter.project))
      return false;
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const handleDrop = async (
    e: React.DragEvent,
    status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'unplanned'
  ) => {
    e.preventDefault();
    setDragOverColumn(null);
    const ticketId = e.dataTransfer.getData('ticketDbId');
    if (!ticketId) return;

    try {
      await updateTicket({ id: ticketId, status });
      toast.success(`Ticket moved to ${status.toUpperCase()}`);
    } catch {
      toast.error('Failed to move ticket');
    }
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
            <SelectValue placeholder="Priority">
              {filter.priority === 'all' && 'All Priorities'}
              {filter.priority === 'critical' && 'Critical'}
              {filter.priority === 'high' && 'High'}
              {filter.priority === 'medium' && 'Medium'}
              {filter.priority === 'low' && 'Low'}
            </SelectValue>
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
            <SelectValue placeholder="Project">
              {filter.project === 'all' ? 'All Projects' : filter.project}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="font-display">
            <SelectItem value="all">All Projects</SelectItem>
            {projectsResponse?.map((p) => (
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
      <div ref={scrollRef} className="overflow-x-auto pb-6 -mx-2 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <UnifiedLoader message="LOADING_BOARD..." />
          </div>
        ) : (
          <div className="flex gap-4 min-w-max h-[calc(100vh-220px)]">
            {columns.map((col) => {
              const colTickets = filteredTickets.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className={cn(
                    'w-[380px] flex flex-col transition-all duration-200',
                    dragOverColumn === col.status &&
                      'bg-primary/5 ring-1 ring-primary/20 ring-inset'
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
                          isMounted={isMounted}
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
        )}
      </div>
    </div>
  );
}
