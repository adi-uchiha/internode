import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests, members } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

// Get leave requests. Admins get all, members get their own.
export const GET = withErrorHandler(async (req, { session, orgId }) => {
  if (!orgId) throw new Error('No active organization');

  // Find the user's role in this organization
  const member = await db.query.members.findFirst({
    where: and(eq(members.userId, session!.user.id), eq(members.organizationId, orgId)),
  });

  const isOrgManager = member?.role === 'admin' || member?.role === 'owner';

  const queryArgs = {
    with: {
      user: true,
    } as const,
    orderBy: [desc(leaveRequests.createdAt)],
    where: and(
      eq(leaveRequests.organizationId, orgId),
      isOrgManager ? undefined : eq(leaveRequests.userId, session!.user.id)
    ),
  };

  const leaves = await db.query.leaveRequests.findMany(queryArgs);
  return NextResponse.json(leaves);
});

// Request new leave
export const POST = withErrorHandler(async (request, { session, orgId }) => {
  const body = await request.json();
  const { type, date, reason } = body;

  if (!type || !date) {
    throw new BadRequestError('Type and Date are required');
  }

  if (!orgId) throw new Error('No active organization');

  const [newLeave] = await db
    .insert(leaveRequests)
    .values({
      id: nanoid(),
      organizationId: orgId,
      userId: session!.user.id,
      type,
      date: new Date(date),
      reason: reason || '',
      status: 'pending',
    })
    .returning();

  return NextResponse.json(newLeave, { status: 201 });
});
