import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs } from '@/db/schema';
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

    const isAdmin = session.user.role === 'admin';

    const existingLog = await db.query.timeLogs.findFirst({
      where: eq(timeLogs.id, id),
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    if (!isAdmin && existingLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
