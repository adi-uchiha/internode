import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const leaveRequests = pgTable('leave_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['sick', 'vacation', 'half-day', 'personal'] }).notNull(),
  date: timestamp('date').notNull(),
  reason: text('reason'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
