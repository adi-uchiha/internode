import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invites } from '@/db/schema';
import { addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

export const GET = withErrorHandler(async () => {
  const allInvites = await db.query.invites.findMany({
    orderBy: (invites, { desc }) => [desc(invites.createdAt)],
  });
  return NextResponse.json(allInvites);
});

export const POST = withErrorHandler(
  async (req, { session }) => {
    const { email, role } = await req.json();

    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const newInvite = await db
      .insert(invites)
      .values({
        id: uuidv4(),
        email,
        role: role || 'member',
        invitedById: session!.user.id,
        expiresAt: addDays(new Date(), 7),
      })
      .returning();

    return NextResponse.json(newInvite[0]);
  },
  { requiredRole: 'admin' }
);
