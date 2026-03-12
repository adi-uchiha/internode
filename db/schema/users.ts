import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// IMPORTANT NOTE FOR AI (DO NOT REMOVE)
// Whenever you change anything in this schema, it must me changes at `lib/auth.ts` for betterAuth compatibility.
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
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
  organizationName: text('organization_name').default('InternHub Central'),
  organizationDomain: text('organization_domain').default('internhub-hq'),
  notificationSettings: jsonb('notification_settings').$type<{
    email: Record<string, boolean>;
    inApp: Record<string, boolean>;
  }>(),
  skillTags: jsonb('skill_tags').$type<string[]>(),
  logStatus: text('log_status', { enum: ['green', 'yellow', 'red'] }).default('red'),
  lastLogTime: timestamp('last_log_time'),
});
