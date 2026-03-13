import { NextResponse } from 'next/server';
import { db } from '@/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(async (req, { session }) => {
  const isGlobalAdmin = session!.user.role === 'admin';
  const orgId = await getActiveOrgId(session!.user.id);

  if (!isGlobalAdmin && !orgId) return NextResponse.json([]);

  // Fetch users: Global Admin gets all, Org Admin gets specific org members
  const orgMembers = await db.query.members.findMany({
    where: isGlobalAdmin ? undefined : eq(members.organizationId, orgId!),
    with: {
      user: true,
    },
  });

  const flattenedUsers = orgMembers.map((m) => {
    return {
      ...m.user,
      department: m.department,
      status: m.status,
      logStatus: m.logStatus,
      lastLogTime: m.lastLogTime,
      skillTags: m.skillTags,
    };
  });

  return NextResponse.json(
    flattenedUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );
});
