import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const inviteStatusEnum = pgEnum('invite_status', [
  'pending',
  'accepted',
  'expired',
  'cancelled',
]);

export const invites = pgTable('invites', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  role: text('role', { enum: ['admin', 'member'] })
    .notNull()
    .default('member'),
  status: text('status', { enum: ['pending', 'accepted', 'expired', 'cancelled'] })
    .notNull()
    .default('pending'),
  invitedById: text('invited_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});
