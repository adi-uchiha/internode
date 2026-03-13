import { NextResponse } from 'next/server';
import { db } from '@/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { orgId }) => {
  if (!orgId) throw new Error('No active organization');

  // Fetch users: strictly Org members
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
      role: m.role,
    };
  });

  return NextResponse.json(
    flattenedUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );
});
