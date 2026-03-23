import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(), // Using nanoid/cuid
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    prefix: text('prefix').notNull(),
    description: text('description'),
    color: text('color'),
    status: text('status', { enum: ['active', 'completed', 'paused', 'archived'] })
      .notNull()
      .default('active'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    techStack: jsonb('tech_stack').$type<string[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return [index('projects_organization_id_idx').on(table.organizationId)];
  }
);

export const projectMembers = pgTable(
  'project_members',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return [index('project_members_organization_id_idx').on(table.organizationId)];
  }
);
