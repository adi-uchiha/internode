import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

// Get leave requests. Admins get all, users get their own.
export const GET = withErrorHandler(async (req, { session }) => {
  const isAdmin = session!.user.role === 'admin';
  const queryArgs = {
    with: {
      user: true,
    } as const,
    orderBy: [desc(leaveRequests.createdAt)],
    where: isAdmin ? undefined : eq(leaveRequests.userId, session!.user.id),
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

  const [newLeave] = await db
    .insert(leaveRequests)
    .values({
      id: nanoid(),
      userId: session!.user.id,
      type,
      date: new Date(date),
      reason: reason || '',
      status: 'pending',
    })
    .returning();

  return NextResponse.json(newLeave, { status: 201 });
});
