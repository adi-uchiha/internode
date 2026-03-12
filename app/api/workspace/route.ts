import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the organization details from the user's record (acting as the current workspace context)
  const userData = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      organizationName: true,
      organizationDomain: true,
    },
  });

  return NextResponse.json(userData);
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { organizationName, organizationDomain } = body;

    // In this simplified architecture, updating the admin's workspace info
    // effectively updates it for the whole organization in this prototype.
    // A robust multi-tenant system would use an 'organizations' table.

    await db
      .update(users)
      .set({
        organizationName,
        organizationDomain,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}
