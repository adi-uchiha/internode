import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, organizations, members } from '@/db/schema';
import { addDays } from 'date-fns';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { ApiError, BadRequestError } from '@/lib/api-error';
import { eq, count } from 'drizzle-orm';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';
import { PLAN_LIMITS, PlanId } from '@/lib/billing-plans';

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

    // Count existing members + pending invitations to prevent circumvention via invite spam
    const pendingInvites = await db.query.invitations.findMany({
      where: (inv, { eq, and }) => and(eq(inv.organizationId, orgId), eq(inv.status, 'pending')),
    });
    const [memberResult] = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, orgId));
    const totalEffective = (memberResult?.count ?? 0) + pendingInvites.length;
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { subscriptionPlan: true },
    });
    const plan = (org?.subscriptionPlan ?? 'free') as PlanId;
    const limit = PLAN_LIMITS[plan].maxMembers;
    if (totalEffective >= limit) {
      throw new ApiError(
        `Member limit reached for ${plan} plan (${limit} max). Upgrade to invite more.`,
        403,
        'plan_limit_exceeded'
      );
    }

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
