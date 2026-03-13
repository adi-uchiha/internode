import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests, members } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/lib/api-error';

// Admin update HR leave state (approve, reject)
export const PATCH = withErrorHandler(
  async (request, { params, session }) => {
    const { id } = await params;
    const body = await request.json();

    const { status } = body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      throw new BadRequestError('Valid status is required');
    }

    const orgId = session!.session.activeOrganizationId;
    if (!orgId) throw new Error('No active organization');

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
  const orgId = session!.session.activeOrganizationId;
  if (!orgId) throw new Error('No active organization');

  // Find the user's role in this organization
  const member = await db.query.members.findFirst({
    where: and(eq(members.userId, session!.user.id), eq(members.organizationId, orgId)),
  });

  const isOrgManager = member?.role === 'admin' || member?.role === 'owner';

  // Admins can delete any, users can only delete their own
  const existingLeave = await db.query.leaveRequests.findFirst({
    where: and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId)),
  });

  if (!existingLeave) {
    throw new NotFoundError('Leave request not found');
  }

  if (!isOrgManager && existingLeave.userId !== session!.user.id) {
    throw new ForbiddenError();
  }

  const [deletedLeave] = await db
    .delete(leaveRequests)
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId)))
    .returning();

  return NextResponse.json({ success: true, deletedLeave });
});
