import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests, members, organizations, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/lib/api-error';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';
import { format } from 'date-fns';

// Admin update HR leave state (approve, reject)
export const PATCH = withErrorHandler(
  async (request, { params, session, orgId }) => {
    const { id } = await params;
    const body = await request.json();

    const { status } = body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      throw new BadRequestError('Valid status is required');
    }

    const [updatedLeave] = await db
      .update(leaveRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId!)))
      .returning();

    if (!updatedLeave) {
      throw new NotFoundError('Leave request not found');
    }

    // --- Email + In-App Notification to the requester (fire-and-forget) ---
    if (status === 'approved' || status === 'rejected') {
      const requester = await db.query.users.findFirst({
        where: eq(users.id, updatedLeave.userId),
        columns: { email: true, name: true },
      });

      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId!),
        columns: { name: true },
      });

      if (requester) {
        void EmailService.leaveStatusChanged({
          organizationId: orgId!,
          requesterId: updatedLeave.userId,
          requesterEmail: requester.email,
          payload: {
            to: requester.email,
            organizationName: org?.name ?? 'Your Organization',
            requesterName: requester.name,
            leaveType: updatedLeave.type,
            leaveDate: format(new Date(updatedLeave.date), 'MMMM d, yyyy'),
            status: status as 'approved' | 'rejected',
            reviewerName: session!.user.name || session!.user.email,
            dashboardUrl: `${NEXT_PUBLIC_APP_URL}/tasks/leaves`,
          },
        });
      }
    }

    return NextResponse.json(updatedLeave);
  },
  { requiredRole: 'admin' }
);

export const DELETE = withErrorHandler(async (request, { params, session, orgId }) => {
  const { id } = await params;

  // Find the user's role in this organization
  const member = await db.query.members.findFirst({
    where: and(eq(members.userId, session!.user.id), eq(members.organizationId, orgId!)),
  });

  const isOrgManager = member?.role === 'admin' || member?.role === 'owner';

  // Admins can delete any, users can only delete their own
  const existingLeave = await db.query.leaveRequests.findFirst({
    where: and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId!)),
  });

  if (!existingLeave) {
    throw new NotFoundError('Leave request not found');
  }

  if (!isOrgManager && existingLeave.userId !== session!.user.id) {
    throw new ForbiddenError();
  }

  const [deletedLeave] = await db
    .delete(leaveRequests)
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, orgId!)))
    .returning();

  return NextResponse.json({ success: true, deletedLeave });
});
