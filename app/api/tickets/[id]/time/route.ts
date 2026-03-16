import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, tickets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { logTimeSchema } from '@/lib/validations/tickets';
import { NotificationService } from '@/lib/notifications';

export const POST = withErrorHandler(async (request, { params, session, orgId }) => {
  const { id } = await params;
  const json = await request.json();
  const body = logTimeSchema.parse(json);

  // Resolve ticket ID if its a short code
  const isPk = id.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

  const existingTicket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId!)),
  });

  if (!existingTicket) {
    throw new NotFoundError('Ticket not found');
  }

  const [newTimeLog] = await db
    .insert(timeLogs)
    .values({
      id: nanoid(),
      organizationId: orgId!,
      ticketId: existingTicket.id, // always use internal PK
      userId: session!.user.id,
      hours: body.hours,
      note: body.note || '',
      date: new Date(body.date),
      isBreakthrough: body.isBreakthrough,
    })
    .returning();

  // Aggregating logged time to parent task cache
  await db
    .update(tickets)
    .set({
      loggedHours: (existingTicket.loggedHours || 0) + body.hours,
      updatedAt: new Date(),
    })
    .where(and(eq(tickets.id, existingTicket.id), eq(tickets.organizationId, orgId!)));

  // --- Notification Trigger ---
  if (newTimeLog) {
    await NotificationService.notifyTicketEvent({
      organizationId: orgId!,
      ticketId: existingTicket.id,
      type: 'time-logged',
      title: 'Time Logged',
      subtitle: `[${existingTicket.ticketId}] ${session!.user.name} logged ${body.hours}h`,
      excludeUserId: session!.user.id,
    });
  }

  // Fetch full ticket with relations to reconcile drift (Blueprint 9.2)
  const updatedTicket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, existingTicket.id), eq(tickets.organizationId, orgId!)),
    with: {
      assignee: true,
      createdBy: true,
      timeLogs: {
        with: { user: true },
        orderBy: (logs, { desc }) => [desc(logs.date)],
      },
      comments: {
        with: { user: true },
        orderBy: (c, { desc }) => [desc(c.createdAt)],
      },
    },
  });

  return NextResponse.json(updatedTicket, { status: 201 });
});
