import { NextResponse } from 'next/server';
import { db } from '@/db';
import { activities } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request, { orgId }) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!orgId) return NextResponse.json([]);

  const queryConditions = [eq(activities.organizationId, orgId)];
  if (userId) queryConditions.push(eq(activities.userId, userId));
  if (type)
    queryConditions.push(
      eq(activities.type, type as 'created' | 'status' | 'time-log' | 'completed' | 'comment')
    );

  const whereClause = and(...queryConditions);

  const allActivities = await db.query.activities.findMany({
    where: whereClause,
    with: {
      user: true,
    },
    orderBy: [desc(activities.createdAt)],
    limit: limit,
  });

  return NextResponse.json(allActivities);
});
