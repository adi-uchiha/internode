import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyLogs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Admins can update 'adminFeedback', members can update their own drafts
    const isAdmin = session.user.role === 'admin';

    // First, verify the log exists and get its owner
    const existingLog = await db.query.dailyLogs.findFirst({
      where: eq(dailyLogs.id, id),
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    if (!isAdmin && existingLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Partial<typeof dailyLogs.$inferInsert> = {};

    if (isAdmin && body.adminFeedback !== undefined) {
      updateData.adminFeedback = body.adminFeedback;
    }

    if (!isAdmin && existingLog.userId === session.user.id) {
      if (body.whatIDid !== undefined) updateData.whatIDid = body.whatIDid;
      if (body.whatILearned !== undefined) updateData.whatILearned = body.whatILearned;
      if (body.hoursWorked !== undefined) updateData.hoursWorked = body.hoursWorked;
      if (body.blockers !== undefined) updateData.blockers = body.blockers;
      if (body.hasBlocker !== undefined) updateData.hasBlocker = body.hasBlocker;
      if (body.isBreakthrough !== undefined) updateData.isBreakthrough = body.isBreakthrough;
      if (body.skillTags !== undefined) updateData.skillTags = body.skillTags;
      if (body.prLinks !== undefined) updateData.prLinks = body.prLinks;
      if (body.docLinks !== undefined) updateData.docLinks = body.docLinks;
      if (body.status !== undefined) updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingLog); // Nothing updated
    }

    updateData.updatedAt = new Date();

    const [updatedLog] = await db
      .update(dailyLogs)
      .set(updateData)
      .where(eq(dailyLogs.id, id))
      .returning();

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
