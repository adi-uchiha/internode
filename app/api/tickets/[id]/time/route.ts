import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, tickets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError, NotFoundError } from '@/lib/api-error';

export const POST = withErrorHandler(async (request, { params, session }) => {
  const { id } = await params;
  const body = await request.json();
  const { hours, note, isBreakthrough, date } = body;

  if (!hours || hours <= 0) {
    throw new BadRequestError('Valid hours are required');
  }

  // Resolve ticket ID if its a short code
  const isPk = id.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

  const existingTicket = await db.query.tickets.findFirst({
    where: ticketQuery,
  });

  if (!existingTicket) {
    throw new NotFoundError('Ticket not found');
  }

  const [newTimeLog] = await db
    .insert(timeLogs)
    .values({
      id: nanoid(),
      ticketId: existingTicket.id, // always safe PK
      userId: session!.user.id,
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
});
