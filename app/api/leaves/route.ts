import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';
import { getActiveOrgId } from '@/lib/api-utils';

// Get leave requests. Admins get all, users get their own.
export const GET = withErrorHandler(async (req, { session }) => {
  const isGlobalAdmin = session!.user.role === 'admin';
  const orgId = await getActiveOrgId(session!.user.id);

  if (!isGlobalAdmin && !orgId) return NextResponse.json([]);

  const isAdmin = isGlobalAdmin || session!.user.role === 'admin'; // In this context, both are the same, but let's be explicit

  const queryArgs = {
    with: {
      user: true,
    } as const,
    orderBy: [desc(leaveRequests.createdAt)],
    where: and(
      isGlobalAdmin ? undefined : eq(leaveRequests.organizationId, orgId!),
      isGlobalAdmin ? undefined : isAdmin ? undefined : eq(leaveRequests.userId, session!.user.id)
    ),
  };

  const leaves = await db.query.leaveRequests.findMany(queryArgs);
  return NextResponse.json(leaves);
});

// Request new leave
export const POST = withErrorHandler(async (request, { session }) => {
  const body = await request.json();
  const { type, date, reason } = body;

  if (!type || !date) {
    throw new BadRequestError('Type and Date are required');
  }

  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) throw new Error('No organization found for user');

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
