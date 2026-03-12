import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invites } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allInvites = await db.query.invites.findMany({
      orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    });
    return NextResponse.json(allInvites);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const newInvite = await db
      .insert(invites)
      .values({
        id: uuidv4(),
        email,
        role: role || 'member',
        invitedById: session.user.id,
        expiresAt: addDays(new Date(), 7),
      })
      .returning();

    return NextResponse.json(newInvite[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
