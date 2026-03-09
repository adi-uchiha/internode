import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, dailyLogs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, sql, and } from 'drizzle-orm';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Total Active Interns
    const activeInternsRes = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(users)
      .where(and(eq(users.role, 'member'), eq(users.status, 'active')));
    const activeInternsCount = activeInternsRes[0]?.count || 0;

    // 2. Total Hours Logged
    const totalHoursRes = await db
      .select({ total: sql<number>`sum(${dailyLogs.hoursWorked})::float` })
      .from(dailyLogs)
      .where(eq(dailyLogs.status, 'submitted'));
    const totalHours = totalHoursRes[0]?.total || 0;

    // 3. Log Rate (Simple estimate for UI)
    const logsCountRes = await db
      .select({ count: sql<number>`count(*)::integer` })
      .from(dailyLogs)
      .where(eq(dailyLogs.status, 'submitted'));
    const logsCount = logsCountRes[0]?.count || 0;

    // Assuming 10 expected logs per intern over some period for a rough gauge
    const logRate =
      activeInternsCount > 0
        ? Math.min(Math.round((logsCount / (activeInternsCount * 10)) * 100), 100)
        : 0;

    // 4. Avg Resolve Time (Placeholder string format for UI layout)
    // Could eventually calculate difference between createdAt and updatedAt for tickets marked 'done'
    const avgResolveTime = '2.4h';

    return NextResponse.json({
      logRate: `${logRate}%`,
      avgResolveTime,
      activeInterns: activeInternsCount.toString(),
      totalHours: Math.round(totalHours).toLocaleString(),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
