import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Example modular schema definition.
 * All timestamp fields should be consistent (createdAt, updatedAt).
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
