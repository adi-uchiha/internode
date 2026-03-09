import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  role: text('role', { enum: ['admin', 'member'] })
    .notNull()
    .default('member'),
  status: text('status', { enum: ['active', 'inactive', 'on-leave'] })
    .notNull()
    .default('active'),
  joinDate: timestamp('join_date').defaultNow(),
  department: text('department'),
  skillTags: jsonb('skill_tags').$type<string[]>(),
  logStatus: text('log_status', { enum: ['green', 'yellow', 'red'] }).default('red'),
  lastLogTime: timestamp('last_log_time'),
});
