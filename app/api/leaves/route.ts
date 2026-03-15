import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { createLeaveSchema } from '@/lib/validations/leaves';

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

  return NextResponse.json(newLeave, { status: 201 });
});
