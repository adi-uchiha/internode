import { db } from '@/db';
import { users, members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const PATCH = withErrorHandler(async (req, { session }) => {
  const body = await req.json();
  const { name, department, notificationSettings, skillTags } = body;

  // Update user name and settings
  await db
    .update(users)
    .set({
      name,
      notificationSettings,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session!.user.id));

  // Update member-specific fields (defaulting to the first membership found)
  const firstMember = await db.query.members.findFirst({
    where: eq(members.userId, session!.user.id),
  });

  if (firstMember) {
    await db
      .update(members)
      .set({
        department,
        skillTags,
        updatedAt: new Date(),
      })
      .where(eq(members.id, firstMember.id));
  }

  return NextResponse.json({ success: true });
});
