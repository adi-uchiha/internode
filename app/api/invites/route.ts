import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, organizations } from '@/db/schema';
import { addDays } from 'date-fns';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';

export const GET = withErrorHandler(
  async (req, { orgId }) => {
    if (!orgId) return NextResponse.json([]);

    const allInvites = await db.query.invitations.findMany({
      where: (inv, { eq }) => eq(inv.organizationId, orgId),
      orderBy: (inv, { desc }) => [desc(inv.createdAt)],
    });
    return NextResponse.json(allInvites);
  },
  { requiredRole: 'admin' }
);

export const POST = withErrorHandler(
  async (req, { session, orgId }) => {
    const { email, role } = await req.json();

    if (!email) {
      throw new BadRequestError('Email is required');
    }

    if (!orgId) throw new Error('No active organization');

    const [newInvite] = await db
      .insert(invitations)
      .values({
        id: nanoid(),
        organizationId: orgId,
        email,
        role: (role as string) || 'member',
        inviterId: session!.user.id,
        expiresAt: addDays(new Date(), 7),
        status: 'pending',
      })
      .returning();

    // Trigger invitation email via EmailService
    if (newInvite) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { name: true },
      });

      void EmailService.sendInvitation({
        inviteeEmail: email,
        payload: {
          to: email, // Required by BaseEmailPayload
          organizationName: org?.name || 'Your Organization',
          inviterName: session!.user.name || session!.user.email || 'Admin',
          inviterEmail: session!.user.email,
          role: (role as string) || 'member',
          acceptUrl: `${NEXT_PUBLIC_APP_URL}/tasks/onboarding?invitationId=${newInvite.id}`,
          baseUrl: NEXT_PUBLIC_APP_URL,
        },
      });
    }

    return NextResponse.json(newInvite);
  },
  { requiredRole: 'admin' }
);
