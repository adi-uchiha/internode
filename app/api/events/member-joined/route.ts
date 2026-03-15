import { NextResponse } from 'next/server';
import { db } from '@/db';
import { members, organizations } from '@/db/schema';
import { eq, and, inArray, ne } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { NotificationService } from '@/lib/notifications';

/**
 * Explicit trigger for member-joined notifications.
 * Called by the frontend (Onboarding or Accept Invite) after successful join.
 */
export const POST = withErrorHandler(async (request, { session, orgId }) => {
  // If orgId is not provided in context (e.g. user just joined but session not updated),
  // we can take it from the request body.
  const { organizationId } = await request.json();
  const targetOrgId = orgId || organizationId;

  if (!targetOrgId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, targetOrgId),
    });

    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

    // Find all owners and admins of this org to notify them
    const admins = await db.query.members.findMany({
      where: and(
        eq(members.organizationId, targetOrgId),
        inArray(members.role, ['owner', 'admin']),
        ne(members.userId, session!.user.id) // Don't notify the person who just joined
      ),
    });

    const promises = admins.map((admin) =>
      NotificationService.create({
        organizationId: targetOrgId,
        userId: admin.userId,
        type: 'member-joined',
        title: 'New Member Joined',
        subtitle: `${session!.user.name || session!.user.email} has joined ${org.name}`,
      })
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Event:MemberJoined] Failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
