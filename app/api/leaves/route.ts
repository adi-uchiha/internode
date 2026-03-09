import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Get leave requests. Admins get all, users get their own.
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isAdmin = session.user.role === 'admin';
    const queryArgs = {
      with: {
        user: true,
      } as const,
      orderBy: [desc(leaveRequests.createdAt)],
      where: isAdmin ? undefined : eq(leaveRequests.userId, session.user.id),
    };

    const leaves = await db.query.leaveRequests.findMany(queryArgs);
    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Request new leave
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, date, reason } = body;

    if (!type || !date) {
      return NextResponse.json({ error: 'Type and Date are required' }, { status: 400 });
    }

    const [newLeave] = await db
      .insert(leaveRequests)
      .values({
        id: nanoid(),
        userId: session.user.id,
        type,
        date: new Date(date),
        reason: reason || '',
        status: 'pending',
      })
      .returning();

    return NextResponse.json(newLeave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
