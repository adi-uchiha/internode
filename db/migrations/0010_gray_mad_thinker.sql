ALTER TABLE "tickets" DROP CONSTRAINT "tickets_project_id_projects_id_fk";
-->statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "project_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
-->statement-breakpoint
UPDATE "tickets" SET "project_ids" = jsonb_build_array("project_id") WHERE "project_id" IS NOT NULL;
-->statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "project_id";