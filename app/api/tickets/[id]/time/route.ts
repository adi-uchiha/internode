import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, tickets, organizations, members } from '@/db/schema';
import { eq, and, inArray, ne, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { logTimeSchema } from '@/lib/validations/tickets';
import { sanitizeHtml } from '@/lib/sanitizer';
import { NotificationService } from '@/lib/notifications';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';

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
      note: body.note ? sanitizeHtml(body.note) : '',
      date: new Date(body.date),
      isBreakthrough: body.isBreakthrough,
    })
    .returning();

  // Aggregating logged time to parent task cache (Atomic increment to avoid race conditions)
  await db
    .update(tickets)
    .set({
      loggedHours: sql`${tickets.loggedHours} + ${body.hours}`,
      updatedAt: new Date(),
    })
    .where(and(eq(tickets.id, existingTicket.id), eq(tickets.organizationId, orgId!)));

  // --- Notification & Email Triggers (fire-and-forget) ---
  if (newTimeLog) {
    // 1. In-app bell notification
    void NotificationService.notifyTicketEvent({
      organizationId: orgId!,
      ticketId: existingTicket.id,
      type: 'time-logged',
      title: 'Time Logged',
      subtitle: `[${existingTicket.ticketId}] ${session!.user.name} logged ${body.hours}h`,
      excludeUserId: session!.user.id,
    });

    // 2. Email Notification to Org Owners and Admins
    if (orgId) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { name: true },
      });

      const adminMembers = await db.query.members.findMany({
        where: and(
          eq(members.organizationId, orgId),
          inArray(members.role, ['owner', 'admin']),
          ne(members.userId, session!.user.id) // Do not email the person who logged the time
        ),
        with: {
          user: { columns: { id: true, email: true, name: true } },
        },
      });

      const adminRecipients = adminMembers
        .filter((m) => m.user)
        .map((m) => ({ userId: m.userId, email: m.user.email, name: m.user.name }));

      void EmailService.timeLogged({
        recipients: adminRecipients,
        payload: {
          to: adminRecipients.map((a) => a.email),
          recipientName: '', // injected in EmailService per-user
          loggerName: session!.user.name || session!.user.email,
          ticketShortId: existingTicket.ticketId,
          ticketTitle: existingTicket.title || 'Untitled Ticket',
          hours: body.hours,
          note: body.note || '',
          organizationName: org?.name ?? 'Your Organization',
          dashboardUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${existingTicket.ticketId}`,
        },
      });
    }
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
