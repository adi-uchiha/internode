import { NextResponse } from 'next/server';
import { db } from '@/db';
import { activities } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const queryConditions = [];
    if (userId) queryConditions.push(eq(activities.userId, userId));
    if (type)
      queryConditions.push(
        eq(activities.type, type as 'created' | 'status' | 'time-log' | 'completed' | 'comment')
      );

    const whereClause = queryConditions.length > 0 ? and(...queryConditions) : undefined;

    const allActivities = await db.query.activities.findMany({
      where: whereClause,
      with: {
        user: true,
      },
      orderBy: [desc(activities.createdAt)],
      limit: limit,
    });

    return NextResponse.json(allActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
