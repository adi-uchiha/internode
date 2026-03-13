import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { organizations } from './organizations';

export const breakthroughs = pgTable('breakthroughs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id),
  date: timestamp('date').notNull().defaultNow(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  skillTags: text('skill_tags').array(), // Stores as #react, #typescript
  adminComment: text('admin_comment'),
  prLink: text('pr_link'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
