'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTickets, type TicketWithRelations } from '@/hooks/useTickets';
import { useAuth } from '@/contexts/AuthContext';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getTimeBarColor,
} from '@/lib/ticket-utils';
import { cn } from '@/lib/utils';

export default function MyTicketsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const { data: allTickets, isLoading: ticketsLoading } = useTickets();

  const myTickets = useMemo(() => {
    if (!allTickets || !user) return [];
    return allTickets
      .filter((t: TicketWithRelations) => t.assigneeId === user.id)
      .filter((t: TicketWithRelations) => statusFilter === 'all' || t.status === statusFilter)
      .filter((t: TicketWithRelations) => t.title.toLowerCase().includes(search.toLowerCase()))
      .map((t: TicketWithRelations) => {
        const loggedHours = t.timeLogs?.reduce((sum, l) => sum + (l.hours || 0), 0) || 0;
        return { ...t, loggedHours };
      })
      .sort((a, b) => {
        if (sortBy === 'newest')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'due-date') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'priority') {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return (
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
          );
        }
        if (sortBy === 'time')
          return (
            (b as TicketWithRelations & { loggedHours: number }).loggedHours -
            (a as TicketWithRelations & { loggedHours: number }).loggedHours
          );
        return 0;
      });
  }, [allTickets, user, statusFilter, search, sortBy]);

  const { now, threeDaysFromNow } = useMemo(() => {
    const d = new Date();
    return {
      now: d,
      threeDaysFromNow: new Date(d.getTime() + 3 * 86400000),
    };
  }, []);

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-sm text-muted-foreground">
        <Icon icon="solar:refresh-linear" className="w-5 h-5 animate-spin mr-2" />
        LOADING_PERSONAL_TASK_MATRIX...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'todo', label: 'To-Do' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'in-review', label: 'In Review' },
            { value: 'done', label: 'Done' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'font-mono text-xs px-3 py-1.5 border transition-colors',
                statusFilter === f.value
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'newest')}>
            <SelectTrigger className="w-[150px] h-8 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="due-date">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="time">Most Time Logged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 border border-border bg-card px-3 h-8">
          <Icon icon="solar:magnifer-linear" className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent font-mono text-xs outline-none w-32 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {myTickets.map((ticket, i) => {
          const pct =
            ticket.estimatedHours > 0 ? (ticket.loggedHours / ticket.estimatedHours) * 100 : 0;
          const ticketDueDate = ticket.dueDate ? new Date(ticket.dueDate) : null;

          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(`/tasks/ticket/${ticket.id}`)}
              className="border border-border bg-card p-5 hover:border-primary/30 transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(ticket.priority)}`}
                  />
                  <h3 className="font-display text-[15px] font-medium group-hover:text-primary transition-colors">
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {ticket.ticketId}
                    </span>
                    {ticket.title}
                  </h3>
                </div>
                {ticket.dueDate && (
                  <span
                    className={cn('font-mono text-xs shrink-0', {
                      'text-destructive': ticketDueDate && ticketDueDate < now,
                      'text-amber-400':
                        ticketDueDate && ticketDueDate >= now && ticketDueDate < threeDaysFromNow,
                      'text-muted-foreground': !ticketDueDate || ticketDueDate >= threeDaysFromNow,
                    })}
                  >
                    Due {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'No Date'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 ml-5">
                <span className="font-mono text-xs text-muted-foreground">
                  ID: {ticket.ticketId}
                </span>
                <div className="flex-1 flex items-center gap-2 max-w-[400px]">
                  <div className="flex-1 h-1.5 bg-muted overflow-hidden">
                    <div
                      className={`h-full ${getTimeBarColor(
                        ticket.loggedHours,
                        ticket.estimatedHours
                      )}`}
                      style={{ width: `${Math.min(150, pct)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {ticket.loggedHours}h / {ticket.estimatedHours}h
                  </span>
                </div>
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {getStatusLabel(ticket.status)}
                </span>
              </div>
            </motion.div>
          );
        })}

        {myTickets.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border bg-card/20">
            <Icon
              icon="solar:document-text-linear"
              className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50"
            />
            <p className="font-mono text-muted-foreground">
              No tickets found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
