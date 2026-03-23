CREATE TABLE "ticket_projects" (
	"ticket_id" text NOT NULL,
	"project_id" text NOT NULL,
	"organization_id" text NOT NULL,
	CONSTRAINT "ticket_projects_ticket_id_project_id_pk" PRIMARY KEY("ticket_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "last_overdue_reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "ticket_projects" ADD CONSTRAINT "ticket_projects_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_projects" ADD CONSTRAINT "ticket_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_projects" ADD CONSTRAINT "ticket_projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ticket_projects_organization_id_idx" ON "ticket_projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tickets_organization_id_idx" ON "tickets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tickets_assignee_id_idx" ON "tickets" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tickets_created_by_id_idx" ON "tickets" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_priority_idx" ON "tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tickets_due_date_idx" ON "tickets" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "members_organization_id_idx" ON "members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "members_user_id_idx" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "members_role_idx" ON "members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "members_status_idx" ON "members" USING btree ("status");