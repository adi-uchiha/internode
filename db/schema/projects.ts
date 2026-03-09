import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(), // Using nanoid/cuid
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  description: text('description'),
  color: text('color'),
  status: text('status', { enum: ['active', 'completed', 'paused'] })
    .notNull()
    .default('active'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  techStack: jsonb('tech_stack').$type<string[]>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projectMembers = pgTable('project_members', {
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
