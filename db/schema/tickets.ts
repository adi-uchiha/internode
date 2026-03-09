import { pgTable, text, timestamp, real, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const tickets = pgTable('tickets', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['todo', 'in-progress', 'in-review', 'done', 'unplanned'] })
    .notNull()
    .default('todo'),
  priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] })
    .notNull()
    .default('medium'),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  createdById: text('created_by_id')
    .notNull()
    .references(() => users.id),
  estimatedHours: real('estimated_hours').notNull().default(0),
  loggedHours: real('logged_hours').notNull().default(0),
  dueDate: timestamp('due_date'),
  labels: jsonb('labels').$type<string[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const timeLogs = pgTable('time_logs', {
  id: text('id').primaryKey(),
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
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
