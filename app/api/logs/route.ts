import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { members } from '@/db/schema';

export const GET = withErrorHandler(async (request, { session, orgId }) => {
  const { searchParams } = new URL(request.url);
  const userIdQuery = searchParams.get('userId');

  if (!orgId) return NextResponse.json([]);

  // Find the user's role in this organization
  const member = await db.query.members.findFirst({
    where: and(eq(members.userId, session!.user.id), eq(members.organizationId, orgId)),
  });

  const isOrgManager = member?.role === 'admin' || member?.role === 'owner';
  const queryConditions = [eq(timeLogs.organizationId, orgId)];

  if (isOrgManager && userIdQuery) {
    queryConditions.push(eq(timeLogs.userId, userIdQuery));
  } else if (!isOrgManager) {
    queryConditions.push(eq(timeLogs.userId, session!.user.id));
  }

  const logs = await db.query.timeLogs.findMany({
    where: and(...queryConditions),
    orderBy: [desc(timeLogs.date)],
  });

  return NextResponse.json(logs);
});

export const POST = withErrorHandler(async (request, { session, orgId }) => {
  const body = await request.json();
  const { date, hours, note, ticketId, isBreakthrough } = body;

  if (!orgId) throw new Error('No active organization');

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
