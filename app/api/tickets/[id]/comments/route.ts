import { NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, tickets, organizations } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { createCommentSchema } from '@/lib/validations/tickets';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';

export const GET = withErrorHandler(async (request, { params, orgId }) => {
  const { id: urlId } = await params;
  if (!orgId) return NextResponse.json([]);

  // Resolve ticket ID if its a short code
  const isPk = urlId.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, urlId) : eq(tickets.ticketId, urlId);

  const ticket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId)),
    columns: { id: true },
  });

  if (!ticket) return NextResponse.json([]);

  const ticketComments = await db.query.comments.findMany({
    where: and(eq(comments.ticketId, ticket.id), eq(comments.organizationId, orgId)),
    with: {
      user: true,
    },
    orderBy: [desc(comments.createdAt)],
  });

  return NextResponse.json(ticketComments);
});

export const POST = withErrorHandler(async (request, { params, session, orgId }) => {
  const { id: ticketId } = await params;
  const json = await request.json();
  const body = createCommentSchema.parse(json);

  // Resolve ticket ID if its a short code
  const isPk = ticketId.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, ticketId) : eq(tickets.ticketId, ticketId);

  const ticket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId!)),
    with: {
      createdBy: { columns: { id: true, email: true, name: true } },
      assignee: { columns: { id: true, email: true, name: true } },
    },
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  const [newCommentRaw] = await db
    .insert(comments)
    .values({
      id: nanoid(),
      organizationId: orgId!,
      ticketId: ticket.id, // always use internal PK
      userId: session!.user.id,
      content: body.content,
    })
    .returning();

  // Fetch full comment with user to reconcile cache
  const fullComment = await db.query.comments.findFirst({
    where: and(eq(comments.id, newCommentRaw.id), eq(comments.organizationId, orgId!)),
    with: {
      user: true,
    },
  });

  // --- Email + Notification Trigger (fire-and-forget) ---
  if (fullComment) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId!),
      columns: { name: true },
    });

    // Build deduplicated recipient list: creator + assignee — excluding the commenter
    const potentialRecipients = [
      ticket.createdBy && {
        userId: ticket.createdBy.id,
        email: ticket.createdBy.email,
        name: ticket.createdBy.name,
      },
      ticket.assignee && {
        userId: ticket.assignee.id,
        email: ticket.assignee.email,
        name: ticket.assignee.name,
      },
    ].filter(
      (r): r is { userId: string; email: string; name: string } =>
        !!r && r.userId !== session!.user.id
    );

    // Deduplicate by userId
    const seen = new Set<string>();
    const recipients = potentialRecipients.filter((r) => {
      if (seen.has(r.userId)) return false;
      seen.add(r.userId);
      return true;
    });

    void EmailService.newComment({
      organizationId: orgId!,
      ticketId: ticket.id,
      excludeUserId: session!.user.id,
      recipients,
      payload: {
        to: [],
        organizationName: org?.name ?? 'Your Organization',
        recipientName: '',
        commenterName: session!.user.name || session!.user.email,
        ticketShortId: ticket.ticketId,
        ticketTitle: ticket.title,
        commentSnippet: body.content.slice(0, 200),
        ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${ticket.ticketId}`,
      },
    });
  }

  return NextResponse.json(fullComment, { status: 201 });
});
