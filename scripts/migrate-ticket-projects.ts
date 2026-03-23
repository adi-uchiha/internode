import { neon } from '@neondatabase/serverless';

const PROD_URL =
  'postgresql://neondb_owner:npg_2vaX5cGHDKxB@ep-small-shape-a16f58i5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DEV_URL =
  'postgresql://neondb_owner:npg_2vaX5cGHDKxB@ep-late-wind-a1um9cc1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function runMigration(url: string, name: string) {
  console.log(`\n--- Running Migration on ${name} ---`);
  const sql = neon(url);

  try {
    // 1. Apply Schema Changes
    console.log(`Applying schema changes to ${name}...`);

    await sql`CREATE TABLE IF NOT EXISTS "ticket_projects" (
      "ticket_id" text NOT NULL,
      "project_id" text NOT NULL,
      "organization_id" text NOT NULL,
      CONSTRAINT "ticket_projects_ticket_id_project_id_pk" PRIMARY KEY("ticket_id","project_id")
    );`;

    await sql`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "last_overdue_reminder_sent_at" timestamp;`;

    // Ignore PK/FK errors if they already exist
    try {
      await sql`ALTER TABLE "ticket_projects" ADD CONSTRAINT "ticket_projects_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch {}
    try {
      await sql`ALTER TABLE "ticket_projects" ADD CONSTRAINT "ticket_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch {}
    try {
      await sql`ALTER TABLE "ticket_projects" ADD CONSTRAINT "ticket_projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch {}

    await sql`CREATE INDEX IF NOT EXISTS "ticket_projects_organization_id_idx" ON "ticket_projects" USING btree ("organization_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "tickets_organization_id_idx" ON "tickets" USING btree ("organization_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "tickets_assignee_id_idx" ON "tickets" USING btree ("assignee_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "tickets_created_by_id_idx" ON "tickets" USING btree ("created_by_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets" USING btree ("status");`;
    await sql`CREATE INDEX IF NOT EXISTS "tickets_priority_idx" ON "tickets" USING btree ("priority");`;
    await sql`CREATE INDEX IF NOT EXISTS "tickets_due_date_idx" ON "tickets" USING btree ("due_date");`;
    await sql`CREATE INDEX IF NOT EXISTS "members_organization_id_idx" ON "members" USING btree ("organization_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "members_user_id_idx" ON "members" USING btree ("user_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "members_role_idx" ON "members" USING btree ("role");`;
    await sql`CREATE INDEX IF NOT EXISTS "members_status_idx" ON "members" USING btree ("status");`;

    try {
      await sql`ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_role_check";`;
    } catch {}
    try {
      await sql`ALTER TABLE "members" ADD CONSTRAINT "members_role_check" CHECK (role IN ('owner', 'admin', 'member'));`;
    } catch {}

    // 2. Migrate Data
    const tickets =
      await sql`SELECT id, organization_id, project_ids FROM tickets WHERE project_ids IS NOT NULL;`;
    console.log(`Found ${tickets.length} tickets to migrate in ${name}.`);

    let migratedCount = 0;
    for (const ticket of tickets) {
      const projectIds = ticket.project_ids;
      if (Array.isArray(projectIds)) {
        for (const projectId of projectIds) {
          try {
            await sql`
              INSERT INTO ticket_projects (ticket_id, project_id, organization_id)
              VALUES (${ticket.id}, ${projectId}, ${ticket.organization_id})
              ON CONFLICT (ticket_id, project_id) DO NOTHING;
            `;
            migratedCount++;
          } catch (e: unknown) {
            const error = e as Error;
            console.error(
              `Failed to migrate ticket ${ticket.id} project ${projectId}: ${error.message}`
            );
          }
        }
      }
    }

    console.log(
      `✅ ${name} migration and ${migratedCount} project relations migrated successfully.`
    );
  } catch (error) {
    console.error(`❌ Unexpected failure in ${name}:`, error);
  }
}

async function main() {
  console.log('Starting full cross-environment migration...');

  await runMigration(DEV_URL, 'DEVELOPMENT');
  await runMigration(PROD_URL, 'PRODUCTION');

  console.log('\n--- All environment migrations finished ---');
}

main();
