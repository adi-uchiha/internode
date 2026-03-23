import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const members = pgTable(
  'members',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'admin', 'member'] })
      .notNull()
      .default('member'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    department: text('department'),
    status: text('status', { enum: ['active', 'inactive', 'on-leave'] })
      .notNull()
      .default('active'),
    skillTags: jsonb('skill_tags').$type<string[]>(),
    logStatus: text('log_status', { enum: ['green', 'yellow', 'red'] }).default('red'),
    lastLogTime: timestamp('last_log_time'),
  },
  (table) => {
    return [
      index('members_organization_id_idx').on(table.organizationId),
      index('members_user_id_idx').on(table.userId),
      index('members_role_idx').on(table.role),
      index('members_status_idx').on(table.status),
    ];
  }
);
