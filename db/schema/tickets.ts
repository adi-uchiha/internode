import {
  pgTable,
  text,
  timestamp,
  real,
  jsonb,
  boolean,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { projects } from './projects';

export const TICKET_STATUSES = ['todo', 'in-progress', 'in-review', 'done', 'unplanned'] as const;
export const TICKET_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

export const tickets = pgTable(
  'tickets',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    ticketId: text('ticket_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['todo', 'in-progress', 'in-review', 'done', 'unplanned'] })
      .notNull()
      .default('todo'),
    priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    projectIds: jsonb('project_ids').$type<string[]>().notNull().default([]),
    assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    createdById: text('created_by_id')
      .notNull()
      .references(() => users.id),
    estimatedHours: real('estimated_hours').notNull().default(0),
    loggedHours: real('logged_hours').notNull().default(0),
    dueDate: timestamp('due_date'),
    lastOverdueReminderSentAt: timestamp('last_overdue_reminder_sent_at'),
    labels: jsonb('labels').$type<string[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return [
      index('tickets_organization_id_idx').on(table.organizationId),
      index('tickets_assignee_id_idx').on(table.assigneeId),
      index('tickets_created_by_id_idx').on(table.createdById),
      index('tickets_status_idx').on(table.status),
      index('tickets_priority_idx').on(table.priority),
      index('tickets_due_date_idx').on(table.dueDate),
    ];
  }
);

export const ticketProjects = pgTable(
  'ticket_projects',
  {
    ticketId: text('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return [
      primaryKey({ columns: [table.ticketId, table.projectId] }),
      index('ticket_projects_organization_id_idx').on(table.organizationId),
    ];
  }
);

export const timeLogs = pgTable('time_logs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ticketId: text('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  hours: real('hours').notNull(),
  note: text('note').notNull(),
  date: timestamp('date').notNull(),
  isBreakthrough: boolean('is_breakthrough').notNull().default(false),
  adminComment: text('admin_comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ticketId: text('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
