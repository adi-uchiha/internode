import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(async (request, { session }) => {
  const { searchParams } = new URL(request.url);
  const userIdQuery = searchParams.get('userId');

  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) return NextResponse.json([]);

  const isAdmin = session!.user.role === 'admin';
  const queryConditions = [eq(timeLogs.organizationId, orgId)];

  if (isAdmin && userIdQuery) {
    queryConditions.push(eq(timeLogs.userId, userIdQuery));
  } else if (!isAdmin) {
    queryConditions.push(eq(timeLogs.userId, session!.user.id));
  }

  const logs = await db.query.timeLogs.findMany({
    where: and(...queryConditions),
    orderBy: [desc(timeLogs.date)],
  });

  return NextResponse.json(logs);
});

export const POST = withErrorHandler(async (request, { session }) => {
  const body = await request.json();
  const { date, hours, note, ticketId, isBreakthrough } = body;

  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) throw new Error('No organization found for user');

  const [newLog] = await db
    .insert(timeLogs)
    .values({
      id: nanoid(),
      organizationId: orgId,
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
