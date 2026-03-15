import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, users, members } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (_req, { orgId }) => {
  // Calculate leaderboard statistics using Drizzle query builder
  const leaderboardRaw = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      ticketsDone: sql<number>`count(${tickets.id}) filter (where ${tickets.status} = 'done')::integer`,
      hoursLogged: sql<number>`COALESCE(sum(${tickets.loggedHours}), 0)::float`,
    })
    .from(users)
    .innerJoin(members, and(eq(members.userId, users.id), eq(members.organizationId, orgId!)))
    .leftJoin(tickets, and(eq(tickets.assigneeId, users.id), eq(tickets.organizationId, orgId!)))
    .groupBy(users.id, users.name, users.image)
    .orderBy(
      desc(sql`count(${tickets.id}) filter (where ${tickets.status} = 'done')`),
      desc(sql`sum(${tickets.loggedHours})`)
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
