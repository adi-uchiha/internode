import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const searchHistory = pgTable('search_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  entityType: text('entity_type', { enum: ['ticket', 'member', 'project'] }).notNull(),
  entityId: text('entity_id').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  lastAccessedAt: timestamp('last_accessed_at').notNull().defaultNow(),
});
