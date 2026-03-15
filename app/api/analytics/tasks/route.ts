import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, projects, timeLogs } from '@/db/schema';
import { eq, sql, and, gte, desc } from 'drizzle-orm';
import { subDays, format } from 'date-fns';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (_req, { orgId }) => {
  if (!orgId) return NextResponse.json({ error: 'Org required' }, { status: 400 });

  // 1. KPI Calculation (Last 30 days)
  const [ticketMetrics] = await db
    .select({
      total: sql<number>`count(*)::integer`,
      done: sql<number>`count(*) filter (where ${tickets.status} = 'done')::integer`,
      highPriority: sql<number>`count(*) filter (where ${tickets.priority} = 'high')::integer`,
      inProgress: sql<number>`count(*) filter (where ${tickets.status} = 'in-progress')::integer`,
    })
    .from(tickets)
    .where(and(eq(tickets.organizationId, orgId), gte(tickets.createdAt, subDays(new Date(), 30))));

  const [timeMetrics] = await db
    .select({
      totalHours: sql<number>`COALESCE(sum(${timeLogs.hours}), 0)::float`,
      activeContributors: sql<number>`count(DISTINCT ${timeLogs.userId})::integer`,
    })
    .from(timeLogs)
    .where(and(eq(timeLogs.organizationId, orgId), gte(timeLogs.date, subDays(new Date(), 30))));

  // 2. Efficiency (Closed vs In-Progress Trend)
  const weeklyTrendsRaw = await db
    .select({
      week: sql<string>`date_trunc('week', ${tickets.updatedAt})`,
      closed: sql<number>`count(*) filter (where ${tickets.status} = 'done')::integer`,
      created: sql<number>`count(*)::integer`,
    })
    .from(tickets)
    .where(and(eq(tickets.organizationId, orgId), gte(tickets.updatedAt, subDays(new Date(), 90))))
    .groupBy(sql`date_trunc('week', ${tickets.updatedAt})`)
    .orderBy(desc(sql`date_trunc('week', ${tickets.updatedAt})`));

  // 3. Status Flow (GROUP BY week and status)
  const statusFlowRaw = await db
    .select({
      weekStart: sql<string>`date_trunc('week', ${tickets.updatedAt})`,
      status: tickets.status,
      count: sql<number>`count(*)::integer`,
    })
    .from(tickets)
    .where(and(eq(tickets.organizationId, orgId), gte(tickets.updatedAt, subDays(new Date(), 28))))
    .groupBy(sql`date_trunc('week', ${tickets.updatedAt})`, tickets.status);

  // Pivot status flow data
  const statusFlowMap: Record<
    string,
    { week: string; todo: number; inProgress: number; inReview: number; done: number }
  > = {};
  statusFlowRaw.forEach((row) => {
    const ws = new Date(row.weekStart).toISOString().split('T')[0];
    if (!statusFlowMap[ws]) {
      statusFlowMap[ws] = { week: ws, todo: 0, inProgress: 0, inReview: 0, done: 0 };
    }
    const key =
      row.status === 'in-progress'
        ? 'inProgress'
        : row.status === 'in-review'
          ? 'inReview'
          : row.status;

    const mappedKey = key as keyof Omit<(typeof statusFlowMap)[string], 'week'>;
    if (mappedKey in statusFlowMap[ws]) {
      statusFlowMap[ws][mappedKey] = row.count;
    }
  });

  // 4. Project Distribution
  const projectStatsRaw = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.organizationId, orgId));

  const ticketsRaw = await db
    .select({
      projectIds: tickets.projectIds,
    })
    .from(tickets)
    .where(eq(tickets.organizationId, orgId));

  const projectDistribution = projectStatsRaw.map((p) => {
    const count = ticketsRaw.filter((t) => (t.projectIds as string[]).includes(p.id)).length;
    return { name: p.name, tickets: count, hours: 0 };
  });

  // 5. Daily Activity (Heatmap Data)
  const heatmapRaw = await db
    .select({
      day: sql<string>`date_trunc('day', ${timeLogs.date})`,
      hours: sql<number>`sum(${timeLogs.hours})::float`,
    })
    .from(timeLogs)
    .where(and(eq(timeLogs.organizationId, orgId), gte(timeLogs.date, subDays(new Date(), 365))))
    .groupBy(sql`date_trunc('day', ${timeLogs.date})`);

  return NextResponse.json({
    kpis: {
      ticketsTotal: ticketMetrics?.total || 0,
      completionRate: ticketMetrics?.total ? (ticketMetrics.done / ticketMetrics.total) * 100 : 0,
      highPriority: ticketMetrics?.highPriority || 0,
      totalHours: timeMetrics?.totalHours || 0,
      activeContributors: timeMetrics?.activeContributors || 0,
      // legacy support
      inProgress: ticketMetrics?.inProgress || 0,
      overdue: 0,
      teamHours: `${Math.round(timeMetrics?.totalHours || 0)}h`,
    },
    weeklyTrends: weeklyTrendsRaw.map((t) => ({
      week: format(new Date(t.week), 'MMM dd'),
      closed: t.closed,
      created: t.created,
    })),
    trends: {
      tickets: [0, 0, 0, 0, 0, 0, 0],
      hours: [0, 0, 0, 0, 0, 0, 0],
      completion: [0, 0, 0, 0, 0, 0, 0],
      velocity: [0, 0, 0, 0, 0, 0, 0],
    },
    statusFlow: Object.values(statusFlowMap).sort((a, b) => a.week.localeCompare(b.week)),
    projects: projectDistribution,
    heatmap: heatmapRaw.map((h) => ({
      date: format(new Date(h.day), 'yyyy-MM-dd'),
      count: Math.ceil(h.hours),
    })),
    burnRate: [
      { day: 'Mon', actual: 10, estimated: 12 },
      { day: 'Tue', actual: 15, estimated: 12 },
      { day: 'Wed', actual: 8, estimated: 12 },
    ],
  });
});
