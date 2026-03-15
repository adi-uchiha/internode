import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { ApiError, BadRequestError } from '@/lib/api-error';

// Get leave requests. Admins get all, members get their own.
export const GET = withErrorHandler(async (req, { session, orgId, orgRole }) => {
  if (!orgId) {
    throw new ApiError('Organization ID is required', 400, 'org_id_required');
  }

  const isOrgManager = orgRole === 'admin' || orgRole === 'owner';

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

  if (!orgId) {
    throw new ApiError('Organization ID is required', 400, 'org_id_required');
  }

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
