import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (_req, { orgId }) => {
  if (!orgId) return NextResponse.json({ error: 'Org required' }, { status: 400 });

  // Efficiently calculate leaderboard in a single query if possible,
  // or optimized multi-step for readability and correctness.

  // No-op for now

  const leaderboardRaw = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      ticketsDone: sql<number>`count(${tickets.id}) filter (where ${tickets.status} = 'done')::integer`,
      hoursLogged: sql<number>`COALESCE(sum(${tickets.loggedHours}), 0)::float`,
    })
    .from(users)
    .innerJoin(
      // We need to join with members to filter by organization
      db
        .select({ userId: sql`user_id` })
        .from(sql`members`)
        .where(eq(sql`organization_id`, orgId))
        .as('org_mems'),
      eq(users.id, sql`org_mems.user_id`)
    )
    .leftJoin(tickets, and(eq(tickets.assigneeId, users.id), eq(tickets.organizationId, orgId)))
    .groupBy(users.id, users.name, users.image)
    .orderBy(
      sql`count(${tickets.id}) filter (where ${tickets.status} = 'done') DESC`,
      sql`sum(${tickets.loggedHours}) DESC`
    )
    .limit(5);

  const leaderboard = leaderboardRaw.map((entry) => ({
    ...entry,
    hoursLogged: entry.hoursLogged.toFixed(1),
    efficiency:
      entry.hoursLogged > 0
        ? Math.min(100, Math.round(((entry.ticketsDone * 4) / entry.hoursLogged) * 100))
        : 0,
  }));

  return NextResponse.json(leaderboard);
});
