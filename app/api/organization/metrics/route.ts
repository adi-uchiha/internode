import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, users, members } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { ApiError } from '@/lib/api-error';

export const GET = withErrorHandler(async (_req, { orgId }) => {
  if (!orgId) {
    throw new ApiError('Organization ID is required', 400, 'org_id_required');
  }

  // Fetch all members with their aggregated stats
  const memberMetrics = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      role: members.role,
      department: members.department,
      status: members.status,
      ticketsDone: sql<number>`count(${tickets.id}) filter (where ${tickets.status} = 'done')::integer`,
      hoursLogged: sql<number>`COALESCE(sum(${tickets.loggedHours}), 0)::float`,
      activeTickets: sql<number>`count(${tickets.id}) filter (where ${tickets.status} != 'done' AND ${tickets.status} != 'unplanned')::integer`,
    })
    .from(users)
    .innerJoin(members, and(eq(members.userId, users.id), eq(members.organizationId, orgId)))
    .leftJoin(tickets, and(eq(tickets.assigneeId, users.id), eq(tickets.organizationId, orgId)))
    .groupBy(users.id, users.name, users.image, members.role, members.department, members.status)
    .orderBy(sql`sum(${tickets.loggedHours}) DESC`);

  const formattedMetrics = memberMetrics.map((m) => ({
    ...m,
    efficiency:
      m.hoursLogged > 0
        ? Math.min(100, Math.round(((m.ticketsDone * 4) / m.hoursLogged) * 100))
        : 0,
    hoursLogged: m.hoursLogged.toFixed(1),
  }));

  return NextResponse.json(formattedMetrics);
});
