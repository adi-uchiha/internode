ALTER TABLE "organizations" ADD COLUMN "subscription_plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "subscription_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "lemon_subscription_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "lemon_customer_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "subscription_current_period_end" timestamp;