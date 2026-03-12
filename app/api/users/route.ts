import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  // Fetch all users (interns/members/admins)
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });

  return NextResponse.json(allUsers);
});
