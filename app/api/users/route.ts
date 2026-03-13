import { NextResponse } from 'next/server';
import { db } from '@/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(async (req, { session }) => {
  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) return NextResponse.json([]);

  // Fetch all users inside the active organization
  const orgMembers = await db.query.members.findMany({
    where: eq(members.organizationId, orgId),
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
