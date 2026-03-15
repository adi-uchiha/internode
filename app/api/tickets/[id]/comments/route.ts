import { NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, tickets } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { createCommentSchema } from '@/lib/validations/tickets';
import { NotificationService } from '@/lib/notifications';

export const GET = withErrorHandler(async (request, { params, orgId }) => {
  const { id: ticketId } = await params;

  const ticketComments = await db.query.comments.findMany({
    where: and(eq(comments.ticketId, ticketId), eq(comments.organizationId, orgId!)),
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

  const ticket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId!)),
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      id: nanoid(),
      organizationId: orgId!,
      ticketId,
      userId: session!.user.id,
      content: body.content,
    })
    .returning();

  // --- Notification Trigger ---
  if (newComment) {
    await NotificationService.notifyTicketEvent({
      organizationId: orgId!,
      ticketId,
      type: 'comment',
      title: 'New Comment',
      subtitle: `[${ticket.ticketId}] ${session!.user.name}: ${body.content.slice(0, 50)}${body.content.length > 50 ? '...' : ''}`,
      excludeUserId: session!.user.id,
    });
  }

  return NextResponse.json(newComment, { status: 201 });
});
