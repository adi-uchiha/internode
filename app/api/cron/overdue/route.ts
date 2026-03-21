import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { lt, and, ne, isNotNull } from 'drizzle-orm';
import { withCronAuth } from '@/lib/api-handler';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';
import { format } from 'date-fns';

/**
 * Cron: Overdue Ticket Reminders
 *
 * Finds all tickets where:
 *  - dueDate is in the past
 *  - status is NOT 'done'
 *  - an assignee exists
 *
 * Sends a personalized overdue reminder email to each assignee
 * (respecting their email preference for 'overdueReminder').
 *
 * Triggered daily Mon–Fri by .github/workflows/cron-overdue.yml
 */
export const GET = withCronAuth(async () => {
  const now = new Date();

  const overdueTickets = await db.query.tickets.findMany({
    where: and(
      lt(tickets.dueDate, now),
      ne(tickets.status, 'done'),
      isNotNull(tickets.dueDate),
      isNotNull(tickets.assigneeId)
    ),
    with: {
      assignee: { columns: { id: true, email: true, name: true } },
      organization: { columns: { name: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  const sendPromises = overdueTickets.map(async (ticket) => {
    if (!ticket.assignee || !ticket.organization || !ticket.dueDate) {
      skipped++;
      return;
    }

    await EmailService.overdueTicket({
      assigneeId: ticket.assigneeId!,
      assigneeEmail: ticket.assignee.email,
      payload: {
        to: ticket.assignee.email,
        organizationName: ticket.organization.name,
        assigneeName: ticket.assignee.name,
        ticketShortId: ticket.ticketId,
        ticketTitle: ticket.title,
        dueDate: format(ticket.dueDate, 'MMMM d, yyyy'),
        ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${ticket.ticketId}`,
      },
    });

    sent++;
  });

  // Run all dispatches concurrently — each is already fire-and-forget internally
  await Promise.allSettled(sendPromises);

  console.log(
    `[cron:overdue] Processed ${overdueTickets.length} tickets. Sent: ${sent}, Skipped: ${skipped}`
  );

  return NextResponse.json({
    success: true,
    processed: overdueTickets.length,
    sent,
    skipped,
  });
});
