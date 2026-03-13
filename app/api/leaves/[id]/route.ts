import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/lib/api-error';
import { getActiveOrgId } from '@/lib/api-utils';

// Admin update HR leave state (approve, reject)
export const PATCH = withErrorHandler(
  async (request, { params, session }) => {
    const { id } = await params;
    const body = await request.json();

    const { status } = body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      throw new BadRequestError('Valid status is required');
    }

    const orgId = await getActiveOrgId(session!.user.id);
    if (!orgId) throw new Error('No organization found for user');

    const [updatedLeave] = await db
      .update(leaveRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId)))
      .returning();

    if (!updatedLeave) {
      throw new NotFoundError('Leave request not found');
    }

    return NextResponse.json(updatedLeave);
  },
  { requiredRole: 'admin' }
);

export const DELETE = withErrorHandler(async (request, { params, session }) => {
  const { id } = await params;
  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) throw new Error('No organization found for user');

  // Admins can delete any, users can only delete their own
  const existingLeave = await db.query.leaveRequests.findFirst({
    where: and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId)),
  });

  if (!existingLeave) {
    throw new NotFoundError('Leave request not found');
  }

  if (session!.user.role !== 'admin' && existingLeave.userId !== session!.user.id) {
    throw new ForbiddenError();
  }

  const [deletedLeave] = await db
    .delete(leaveRequests)
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId)))
    .returning();

  return NextResponse.json({ success: true, deletedLeave });
});
