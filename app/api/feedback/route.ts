import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { isNull, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
  } catch (error) {
    console.error('Error fetching feedback data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
