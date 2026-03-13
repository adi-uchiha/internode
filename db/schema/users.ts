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
  joinDate: timestamp('join_date').defaultNow(),
  notificationSettings: jsonb('notification_settings').$type<{
    email: Record<string, boolean>;
    inApp: Record<string, boolean>;
  }>(),
});
