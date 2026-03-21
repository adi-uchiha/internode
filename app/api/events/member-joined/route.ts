import { NextResponse } from 'next/server';
import { db } from '@/db';
import { members, organizations } from '@/db/schema';
import { eq, and, inArray, ne } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { NotificationService } from '@/lib/notifications';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';

/**
 * Explicit trigger for member-joined notifications.
 * Called by the frontend (Onboarding or Accept Invite) after successful join.
 */
export const POST = withErrorHandler(async (request, { session, orgId }) => {
  // orgId may not be in context yet if the user just joined
  const { organizationId } = await request.json();
  const targetOrgId = orgId || organizationId;

  if (!targetOrgId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, targetOrgId),
  });

  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

  // Find all owners and admins of this org to notify them
  const adminMembers = await db.query.members.findMany({
    where: and(
      eq(members.organizationId, targetOrgId),
      inArray(members.role, ['owner', 'admin']),
      ne(members.userId, session!.user.id) // Don't notify the person who just joined
    ),
    with: {
      user: { columns: { id: true, email: true, name: true } },
    },
  });

  // 1. In-app notifications (existing behavior — preserved)
  const inAppPromises = adminMembers.map((admin) =>
    NotificationService.create({
      organizationId: targetOrgId,
      userId: admin.userId,
      type: 'member-joined',
      title: 'New Member Joined',
      subtitle: `${session!.user.name || session!.user.email} has joined ${org.name}`,
    })
  );
  await Promise.all(inAppPromises);

  // 2. Email notifications to each eligible admin (fire-and-forget)
  const adminRecipients = adminMembers
    .filter((m) => m.user)
    .map((m) => ({ userId: m.userId, email: m.user.email, name: m.user.name }));

  void EmailService.memberJoined({
    adminRecipients,
    payload: {
      to: adminRecipients.map((a) => a.email),
      organizationName: org.name,
      adminName: '', // resolved per-admin inside EmailService
      newMemberName: session!.user.name || session!.user.email,
      newMemberEmail: session!.user.email,
      membersUrl: `${NEXT_PUBLIC_APP_URL}/tasks/settings`,
    },
  });

  return NextResponse.json({ success: true });
});
