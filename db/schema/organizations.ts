import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: text('metadata'), // JSON string for custom org settings
  ticketCounter: integer('ticket_counter').notNull().default(0),

  // --- NEW BILLING COLUMNS ---
  subscriptionPlan: text('subscription_plan').notNull().default('free'),
  // 'free' | 'pro' | 'enterprise'

  subscriptionStatus: text('subscription_status').notNull().default('active'),
  // 'active' | 'canceled' | 'past_due' | 'unpaid' | 'expired'

  lemonSubscriptionId: text('lemon_subscription_id'),
  lemonCustomerId: text('lemon_customer_id'),
  subscriptionCurrentPeriodEnd: timestamp('subscription_current_period_end'),
});
