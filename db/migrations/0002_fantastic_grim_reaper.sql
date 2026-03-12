CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "breakthroughs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text,
	"date" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"skill_tags" text[],
	"admin_comment" text,
	"pr_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "daily_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_name" text DEFAULT 'InternHub Central';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_domain" text DEFAULT 'internhub-hq';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_settings" jsonb;--> statement-breakpoint
ALTER TABLE "time_logs" ADD COLUMN "admin_comment" text;--> statement-breakpoint
ALTER TABLE "breakthroughs" ADD CONSTRAINT "breakthroughs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakthroughs" ADD CONSTRAINT "breakthroughs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;