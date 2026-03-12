import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs } from '@/db/schema';
import { isNull, desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(
  async () => {
    const pendingLogs = await db.query.timeLogs.findMany({
      where: isNull(timeLogs.adminComment),
      with: {
        user: true,
      },
      orderBy: [desc(timeLogs.createdAt)],
    });

    const pendingBreakthroughs = await db.query.breakthroughs.findMany({
      where: isNull(breakthroughs.adminComment),
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
