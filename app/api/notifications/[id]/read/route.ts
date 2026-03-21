import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const PATCH = withErrorHandler(async (request, { session, orgId, params }) => {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, session!.user.id),
        eq(notifications.organizationId, orgId!)
      )
    );

  return NextResponse.json({ success: true });
});
