import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { session, orgId }) => {
  const userNotifications = await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, session!.user.id),
      eq(notifications.organizationId, orgId!)
    ),
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });
  return NextResponse.json(userNotifications);
});
