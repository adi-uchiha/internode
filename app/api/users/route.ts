import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  // Fetch all users (interns/members/admins)
  const allUsers = await db.query.users.findMany({
    with: {
      memberships: true,
    },
    orderBy: [desc(users.createdAt)],
  });

  const flattenedUsers = allUsers.map((u) => {
    const member = u.memberships?.[0];
    return {
      ...u,
      department: member?.department,
      status: member?.status,
      logStatus: member?.logStatus,
      lastLogTime: member?.lastLogTime,
      skillTags: member?.skillTags,
    };
  });

  return NextResponse.json(flattenedUsers);
});
