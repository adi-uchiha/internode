import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, members } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request, { session, orgId }) => {
  const { searchParams } = new URL(request.url);
  const userIdQuery = searchParams.get('userId');

  if (!orgId) return NextResponse.json([]);

  // Resolve the caller's role in this organization
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
