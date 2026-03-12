import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const PATCH = withErrorHandler(async (request, { session }) => {
  // Mark all as read for the current user
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, session!.user.id), eq(notifications.read, false)));

  return NextResponse.json({ success: true });
});
