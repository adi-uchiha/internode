import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, tickets, members } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { Session } from '@/lib/auth-types';

export const GET = withErrorHandler(
  async (req, { session: _session }) => {
    const session = _session as Session;
    const orgId = session!.session.activeOrganizationId;
    if (!orgId) throw new Error('No active organization');

    const orgFilter = eq(members.organizationId, orgId);
    const timeLogFilter = eq(timeLogs.organizationId, orgId);
    const ticketFilter = eq(tickets.organizationId, orgId);

    // 1. Total Active Engineers
    const activeEngineersRes = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(members)
      .where(and(orgFilter, eq(members.status, 'active')));
    const activeEngineersCount = activeEngineersRes[0]?.count || 0;

    // 2. Total Hours Logged
    const totalHoursRes = await db
      .select({ total: sql<number>`sum(${timeLogs.hours})::float` })
      .from(timeLogs)
      .where(timeLogFilter);
    const totalHours = totalHoursRes[0]?.total || 0;

    // 3. Log Rate (Simple estimate for UI)
    const logsCountRes = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(timeLogs)
      .where(timeLogFilter);
    const logsCount = logsCountRes[0]?.count || 0;

    // Assuming 10 expected logs per engineer over some period for a rough gauge
    const logRate =
      activeEngineersCount > 0
        ? Math.min(Math.round((logsCount / (activeEngineersCount * 10)) * 100), 100)
        : 0;

    // 4. Avg Resolve Time
    const resolvedTickets = await db
      .select({
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .where(and(ticketFilter, eq(tickets.status, 'done')));

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
      activeEngineers: activeEngineersCount.toString(),
      totalHours: Math.round(totalHours).toLocaleString(),
    });
  },
  { requiredRole: 'admin' }
);
