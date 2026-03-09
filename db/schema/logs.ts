import { pgTable, text, timestamp, boolean, real, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const dailyLogs = pgTable('daily_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  whatIDid: text('what_i_did').notNull(),
  whatILearned: text('what_i_learned').notNull(),
  hoursWorked: real('hours_worked').notNull(),
  blockers: text('blockers'),
  hasBlocker: boolean('has_blocker').notNull().default(false),
  isBreakthrough: boolean('is_breakthrough').notNull().default(false),
  skillTags: jsonb('skill_tags').$type<string[]>(),
  prLinks: jsonb('pr_links').$type<string[]>(),
  docLinks: jsonb('doc_links').$type<string[]>(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['draft', 'submitted'] })
    .notNull()
    .default('draft'),
  adminFeedback: text('admin_feedback'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
