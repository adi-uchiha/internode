import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userIdQuery = searchParams.get('userId');

  try {
    const isAdmin = session.user.role === 'admin';
    let condition = undefined;
    if (isAdmin && userIdQuery) {
      condition = eq(timeLogs.userId, userIdQuery);
    } else if (!isAdmin) {
      condition = eq(timeLogs.userId, session.user.id);
    }

    const logs = await db.query.timeLogs.findMany({
      where: condition,
      orderBy: [desc(timeLogs.date)],
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, hours, note, ticketId, isBreakthrough } = body;

    const [newLog] = await db
      .insert(timeLogs)
      .values({
        id: nanoid(),
        userId: session.user.id,
        ticketId,
        hours: hours || 0,
        note: note || '',
        date: new Date(date),
        isBreakthrough: !!isBreakthrough,
      })
      .returning();

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
