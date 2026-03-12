import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const PATCH = withErrorHandler(async (req, { session }) => {
  const body = await req.json();
  const { name, department, notificationSettings, skillTags } = body;

  await db
    .update(users)
    .set({
      name,
      department,
      notificationSettings,
      skillTags,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session!.user.id));

  return NextResponse.json({ success: true });
});
