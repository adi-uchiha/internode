import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request, { session }) => {
  const { searchParams } = new URL(request.url);
  const userIdQuery = searchParams.get('userId');

  const isAdmin = session!.user.role === 'admin';
  let condition = undefined;
  if (isAdmin && userIdQuery) {
    condition = eq(timeLogs.userId, userIdQuery);
  } else if (!isAdmin) {
    condition = eq(timeLogs.userId, session!.user.id);
  }

  const logs = await db.query.timeLogs.findMany({
    where: condition,
    orderBy: [desc(timeLogs.date)],
  });

  return NextResponse.json(logs);
});

export const POST = withErrorHandler(async (request, { session }) => {
  const body = await request.json();
  const { date, hours, note, ticketId, isBreakthrough } = body;

  const [newLog] = await db
    .insert(timeLogs)
    .values({
      id: nanoid(),
      userId: session!.user.id,
      ticketId,
      hours: hours || 0,
      note: note || '',
      date: new Date(date),
      isBreakthrough: !!isBreakthrough,
    })
    .returning();

  return NextResponse.json(newLog, { status: 201 });
});
