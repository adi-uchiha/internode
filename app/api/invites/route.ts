import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { addDays } from 'date-fns';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';
import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(async (req, { session }) => {
  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) return NextResponse.json([]);

  const allInvites = await db.query.invitations.findMany({
    where: (inv, { eq }) => eq(inv.organizationId, orgId),
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  });
  return NextResponse.json(allInvites);
});

export const POST = withErrorHandler(
  async (req, { session }) => {
    const { email, role } = await req.json();

    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const orgId = await getActiveOrgId(session!.user.id);
    if (!orgId) throw new Error('No organization found for user');

    const newInvite = await db
      .insert(invitations)
      .values({
        id: nanoid(),
        organizationId: orgId,
        email,
        role: role || 'member',
        inviterId: session!.user.id,
        expiresAt: addDays(new Date(), 7),
        status: 'pending',
      })
      .returning();

    return NextResponse.json(newInvite[0]);
  },
  { requiredRole: 'admin' }
);
