import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, tickets, members } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(
  async (req, { session }) => {
    const orgId = await getActiveOrgId(session!.user.id);
    if (!orgId) return NextResponse.json({});

    // 1. Total Active Interns (from members of this org)
    const activeInternsRes = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(members)
      .where(and(eq(members.organizationId, orgId), eq(members.status, 'active')));
    const activeInternsCount = activeInternsRes[0]?.count || 0;

    // 2. Total Hours Logged
    const totalHoursRes = await db
      .select({ total: sql<number>`sum(${timeLogs.hours})::float` })
      .from(timeLogs)
      .where(eq(timeLogs.organizationId, orgId));
    const totalHours = totalHoursRes[0]?.total || 0;

    // 3. Log Rate (Simple estimate for UI)
    const logsCountRes = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(timeLogs)
      .where(eq(timeLogs.organizationId, orgId));
    const logsCount = logsCountRes[0]?.count || 0;

    // Assuming 10 expected logs per intern over some period for a rough gauge
    const logRate =
      activeInternsCount > 0
        ? Math.min(Math.round((logsCount / (activeInternsCount * 10)) * 100), 100)
        : 0;

    // 4. Avg Resolve Time
    const resolvedTickets = await db
      .select({
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .where(and(eq(tickets.organizationId, orgId), eq(tickets.status, 'done')));

    let avgResolveTime = 'N/A';
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((acc, t) => {
        const diff = t.updatedAt.getTime() - t.createdAt.getTime();
        return acc + diff;
      }, 0);
      const avgMs = totalTime / resolvedTickets.length;
      const avgHours = avgMs / (1000 * 60 * 60);
      avgResolveTime = `${avgHours.toFixed(1)}h`;
    }

    return NextResponse.json({
      logRate: `${logRate}%`,
      avgResolveTime,
      activeInterns: activeInternsCount.toString(),
      totalHours: Math.round(totalHours).toLocaleString(),
    });
  },
  { requiredRole: 'admin' }
);
