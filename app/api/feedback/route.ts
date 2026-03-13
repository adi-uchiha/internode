import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs } from '@/db/schema';
import { isNull, desc, eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(
  async (req, { orgId }) => {
    if (!orgId) return NextResponse.json({ logs: [], breakthroughs: [] });
    const pendingLogs = await db.query.timeLogs.findMany({
      where: and(isNull(timeLogs.adminComment), eq(timeLogs.organizationId, orgId)),
      with: {
        user: true,
      },
      orderBy: [desc(timeLogs.createdAt)],
    });

    const pendingBreakthroughs = await db.query.breakthroughs.findMany({
      where: and(isNull(breakthroughs.adminComment), eq(breakthroughs.organizationId, orgId)),
      with: {
        user: true,
      },
      orderBy: [desc(breakthroughs.createdAt)],
    });

    return NextResponse.json({
      logs: pendingLogs,
      breakthroughs: pendingBreakthroughs,
    });
  },
  { requiredRole: 'admin' }
);
