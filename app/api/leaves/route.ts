import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests, members, organizations } from '@/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { createLeaveSchema } from '@/lib/validations/leaves';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';
import { format } from 'date-fns';

// Get leave requests. Admins get all, members get their own.
export const GET = withErrorHandler(async (req, { session, orgId, orgRole }) => {
  const isOrgManager = orgRole === 'admin' || orgRole === 'owner';

  const queryArgs = {
    with: {
      user: true,
    } as const,
    orderBy: [desc(leaveRequests.createdAt)],
    where: and(
      eq(leaveRequests.organizationId, orgId!),
      isOrgManager ? undefined : eq(leaveRequests.userId, session!.user.id)
    ),
  };

  const leaves = await db.query.leaveRequests.findMany(queryArgs);
  return NextResponse.json(leaves);
});

// Request new leave
export const POST = withErrorHandler(async (request, { session, orgId }) => {
  const json = await request.json();
  const body = createLeaveSchema.parse(json);

  const [newLeave] = await db
    .insert(leaveRequests)
    .values({
      id: nanoid(),
      organizationId: orgId!,
      userId: session!.user.id,
      type: body.type,
      date: new Date(body.date),
      reason: body.reason || '',
      status: 'pending',
    })
    .returning();

  // --- Email + In-App Notification to all org admins (fire-and-forget) ---
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId!),
    columns: { name: true },
  });

  const adminMembers = await db.query.members.findMany({
    where: and(eq(members.organizationId, orgId!), inArray(members.role, ['owner', 'admin'])),
    with: {
      user: { columns: { id: true, email: true, name: true } },
    },
  });

  const adminRecipients = adminMembers
    .filter((m) => m.user && m.userId !== session!.user.id)
    .map((m) => ({ userId: m.userId, email: m.user.email, name: m.user.name }));

  void EmailService.leaveSubmitted({
    organizationId: orgId!,
    adminRecipients,
    payload: {
      to: adminRecipients.map((a) => a.email),
      organizationName: org?.name ?? 'Your Organization',
      adminName: '', // resolved per-admin inside EmailService
      requesterName: session!.user.name || session!.user.email,
      leaveType: body.type,
      leaveDate: format(new Date(body.date), 'MMMM d, yyyy'),
      reason: body.reason,
      dashboardUrl: `${NEXT_PUBLIC_APP_URL}/tasks/leaves`,
    },
  });

  return NextResponse.json(newLeave, { status: 201 });
});
