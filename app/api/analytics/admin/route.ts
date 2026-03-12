import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, timeLogs, tickets } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(
  async () => {
    // 1. Total Active Interns
    const activeInternsRes = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(users)
      .where(and(eq(users.role, 'member'), eq(users.status, 'active')));
    const activeInternsCount = activeInternsRes[0]?.count || 0;

    // 2. Total Hours Logged
    const totalHoursRes = await db
      .select({ total: sql<number>`sum(${timeLogs.hours})::float` })
      .from(timeLogs);
    const totalHours = totalHoursRes[0]?.total || 0;

    // 3. Log Rate (Simple estimate for UI)
    const logsCountRes = await db.select({ count: sql<number>`count(*)::integer` }).from(timeLogs);
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
      .where(eq(tickets.status, 'done'));

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
