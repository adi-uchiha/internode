import { db } from '../db';
import {
  organizations,
  members,
  projects,
  projectMembers,
  tickets,
  timeLogs,
  comments,
  leaveRequests,
  weeklyGoals,
  breakthroughs,
  labels,
  activities,
  notifications,
  searchHistory,
  users,
} from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function main() {
  console.log('--- Starting Multi-Tenant Backfill ---');

  // 1. Create HQ Organization
  const hqOrgId = nanoid();
  console.log(`Creating HQ Organization: InternHub Central (${hqOrgId})`);

  // Try to find if it already exists by slug
  let hqOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, 'internhub-hq'),
  });

  if (!hqOrg) {
    await db.insert(organizations).values({
      id: hqOrgId,
      name: 'InternHub Central',
      slug: 'internhub-hq',
    });

    hqOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, 'internhub-hq'),
    });
  }

  if (!hqOrg) {
    throw new Error('Failed to create or find HQ organization');
  }

  const finalHqId = hqOrg.id;
  console.log(`Using HQ Org ID: ${finalHqId}`);

  // 2. Migrate Users to Members
  console.log('Backfilling members table...');
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    const existingMember = await db.query.members.findFirst({
      where: (members, { and }) =>
        and(eq(members.userId, user.id), eq(members.organizationId, finalHqId)),
    });

    if (!existingMember) {
      console.log(`Adding user ${user.email} to HQ org...`);
      await db.insert(members).values({
        id: nanoid(),
        organizationId: finalHqId,
        userId: user.id,
        role: (user as unknown as Record<string, unknown>).role === 'admin' ? 'owner' : 'member',
      });
    }
  }

  // 3. Backfill tenant-level tables
  const tables = [
    { name: 'projects', table: projects },
    { name: 'projectMembers', table: projectMembers },
    { name: 'tickets', table: tickets },
    { name: 'timeLogs', table: timeLogs },
    { name: 'comments', table: comments },
    { name: 'leaveRequests', table: leaveRequests },
    { name: 'weeklyGoals', table: weeklyGoals },
    { name: 'breakthroughs', table: breakthroughs },
    { name: 'labels', table: labels },
    { name: 'activities', table: activities },
    { name: 'notifications', table: notifications },
    { name: 'searchHistory', table: searchHistory },
  ];

  for (const { name, table } of tables) {
    console.log(`Backfilling ${name}...`);
    await db.update(table).set({ organizationId: finalHqId }).where(isNull(table.organizationId));
  }

  console.log('✅ Backfill completed successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
