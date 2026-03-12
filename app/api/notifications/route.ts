import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { session }) => {
  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.userId, session!.user.id),
    orderBy: [desc(notifications.createdAt)],
    limit: 20,
  });
  return NextResponse.json(userNotifications);
});
