export type TicketStatus = 'todo' | 'in-progress' | 'in-review' | 'done' | 'unplanned';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

export const getStatusColor = (status: TicketStatus | string) => {
  const colors: Record<string, string> = {
    todo: 'text-muted-foreground bg-muted-foreground/15',
    'in-progress': 'text-blue-400 bg-blue-400/15',
    'in-review': 'text-amber-400 bg-amber-400/15',
    done: 'text-primary bg-primary/15',
    unplanned: 'text-purple-400 bg-purple-400/15',
  };
  return colors[status] || colors.todo;
};

export const getStatusLabel = (status: TicketStatus | string) => {
  const labels: Record<string, string> = {
    todo: 'TO-DO',
    'in-progress': 'IN PROGRESS',
    'in-review': 'IN REVIEW',
    done: 'DONE',
    unplanned: 'UNPLANNED',
  };
  return labels[status] || status.toUpperCase();
};

export const getPriorityColor = (priority: TicketPriority | string) => {
  const colors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-muted-foreground',
  };
  return colors[priority] || colors.medium;
};

export const getTimeBarColor = (logged: number, estimated: number) => {
  if (!estimated || estimated === 0) return 'bg-primary';
  const pct = (logged / estimated) * 100;
  if (pct > 100) return 'bg-destructive';
  if (pct > 80) return 'bg-amber-500';
  return 'bg-primary';
};
export const calculateEfficiency = (ticketsDone: number, hoursLogged: number | string) => {
  const hours = typeof hoursLogged === 'string' ? parseFloat(hoursLogged) : hoursLogged;
  if (!hours || hours === 0) return 0;
  // Formula: ((ticketsDone * PRODUCTIVITY_FACTOR) / hoursLogged) * 100
  // Note: For now we default to 4 if constants aren't imported or we hardcode to match plan.
  // Ideally this would import ANALYTICS from lib/constants but avoid circular dep for utils.
  return Math.round(((ticketsDone * 4) / hours) * 100);
};
