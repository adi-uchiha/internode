import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { ForbiddenError, NotFoundError } from '@/lib/api-error';

export const PATCH = withErrorHandler(async (request, { params, session }) => {
  const { id } = await params;
  const body = await request.json();

  const isAdmin = session!.user.role === 'admin';

  const existingLog = await db.query.timeLogs.findFirst({
    where: eq(timeLogs.id, id),
  });

  if (!existingLog) {
    throw new NotFoundError('Log not found');
  }

  if (!isAdmin && existingLog.userId !== session!.user.id) {
    throw new ForbiddenError();
  }

  const updateData: Partial<typeof timeLogs.$inferInsert> = {};

  if (body.hours !== undefined) updateData.hours = body.hours;
  if (body.note !== undefined) updateData.note = body.note;
  if (body.date !== undefined) updateData.date = new Date(body.date);
  if (body.isBreakthrough !== undefined) updateData.isBreakthrough = body.isBreakthrough;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(existingLog);
  }

  const [updatedLog] = await db
    .update(timeLogs)
    .set(updateData)
    .where(eq(timeLogs.id, id))
    .returning();

  return NextResponse.json(updatedLog);
});
