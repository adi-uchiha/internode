import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { session }) => {
  // Fetch the organization details from the user's record (acting as the current workspace context)
  const userData = await db.query.users.findFirst({
    where: eq(users.id, session!.user.id),
    columns: {
      organizationName: true,
      organizationDomain: true,
    },
  });

  return NextResponse.json(userData);
});

export const PATCH = withErrorHandler(
  async (req, { session }) => {
    const body = await req.json();
    const { organizationName, organizationDomain } = body;

    // In this simplified architecture, updating the admin's workspace info
    // effectively updates it for the whole organization in this prototype.
    await db
      .update(users)
      .set({
        organizationName,
        organizationDomain,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session!.user.id));

    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
