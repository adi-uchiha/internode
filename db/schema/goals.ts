import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const weeklyGoals = pgTable('weekly_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weekStart: timestamp('week_start').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const goalItems = pgTable('goal_items', {
  id: text('id').primaryKey(),
  weeklyGoalId: text('weekly_goal_id')
    .notNull()
    .references(() => weeklyGoals.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
});
