import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, projects, timeLogs } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { startOfWeek, subDays, format } from 'date-fns';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  // 1. KPI Counts
  const totalTicketsRes = await db.select({ count: sql<number>`count(*)::integer` }).from(tickets);
  const inProgressTicketsRes = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(tickets)
    .where(eq(tickets.status, 'in-progress'));
  const overdueTicketsRes = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(tickets)
    .where(and(sql`${tickets.dueDate} < now()`, sql`${tickets.status} != 'done'`));

  // 2. Weekly Team Hours
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyHoursRes = await db
    .select({ total: sql<number>`sum(${timeLogs.hours})::float` })
    .from(timeLogs)
    .where(gte(timeLogs.date, startOfCurrentWeek));

  // 3. Burn Rate Data (Estimated vs Actual for last 7 days)
  const burnRateData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayLabel = format(date, 'EEE');
    const dateStr = format(date, 'yyyy-MM-dd');

    const dayHoursRes = await db
      .select({ total: sql<number>`sum(${timeLogs.hours})::float` })
      .from(timeLogs)
      .where(sql`date_trunc('day', ${timeLogs.date}) = ${dateStr}`);

    burnRateData.push({
      day: dayLabel,
      actual: dayHoursRes[0]?.total || 0,
      estimated: (dayHoursRes[0]?.total || 0) * 1.1, // Mocking estimate based on actual for visual
    });
  }

  // 4. Project Hours
  const projectHoursRes = await db
    .select({
      name: projects.name,
      actual: sql<number>`sum(${tickets.loggedHours})::float`,
      estimated: sql<number>`sum(${tickets.estimatedHours})::float`,
    })
    .from(tickets)
    .innerJoin(projects, eq(tickets.projectId, projects.id))
    .groupBy(projects.name);

  return NextResponse.json({
    kpis: {
      totalTickets: totalTicketsRes[0]?.count || 0,
      completedTickets: (totalTicketsRes[0]?.count || 0) - (inProgressTicketsRes[0]?.count || 0),
      inProgress: inProgressTicketsRes[0]?.count || 0,
      overdue: overdueTicketsRes[0]?.count || 0,
      teamHours: (weeklyHoursRes[0]?.total || 0).toFixed(1) + 'h',
    },
    burnRate: burnRateData,
    projectHours: projectHoursRes.map((p) => ({
      project: p.name,
      actual: p.actual || 0,
      estimated: p.estimated || 0,
    })),
  });
});
