import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, tickets } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { hours, note, isBreakthrough, date } = body;

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Valid hours are required' }, { status: 400 });
    }

    // Resolve ticket ID if its a short code
    const isPk = id.length > 15;
    const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

    const existingTicket = await db.query.tickets.findFirst({
      where: ticketQuery,
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const [newTimeLog] = await db
      .insert(timeLogs)
      .values({
        id: nanoid(),
        ticketId: existingTicket.id, // always safe PK
        userId: session.user.id,
        hours,
        note: note || '',
        date: date ? new Date(date) : new Date(),
        isBreakthrough: isBreakthrough || false,
      })
      .returning();

    // Aggregating logged time to parent task cache
    await db
      .update(tickets)
      .set({
        loggedHours: (existingTicket.loggedHours || 0) + hours,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, existingTicket.id));

    return NextResponse.json(newTimeLog, { status: 201 });
  } catch (error) {
    console.error('Error logging time:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
