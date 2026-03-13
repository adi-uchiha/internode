import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tickets } from './tickets';
import { organizations } from './organizations';

export const activities = pgTable('activities', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  ticketId: text('ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
  ticketTitle: text('ticket_title'),
  type: text('type', { enum: ['created', 'status', 'time-log', 'completed', 'comment'] }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['assigned', 'overdue', 'status', 'time-logged', 'comment', 'member-joined'],
  }).notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
