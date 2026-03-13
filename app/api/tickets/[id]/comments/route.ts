import { NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, tickets } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

export const GET = withErrorHandler(async (request, { params, orgId }) => {
  const { id: ticketId } = await params;

  if (!orgId) return NextResponse.json([]);

  const ticketComments = await db.query.comments.findMany({
    where: and(eq(comments.ticketId, ticketId), eq(comments.organizationId, orgId)),
    with: {
      user: true,
    },
    orderBy: [desc(comments.createdAt)],
  });

  return NextResponse.json(ticketComments);
});

export const POST = withErrorHandler(async (request, { params, session, orgId }) => {
  const { id: ticketId } = await params;
  const { content } = await request.json();

  if (!content) {
    throw new BadRequestError('Content is required');
  }

  if (!orgId) throw new Error('No active organization');

  const ticket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)),
  });

  if (!ticket) {
    throw new BadRequestError('Ticket not found');
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      id: nanoid(),
      organizationId: orgId,
      ticketId,
      userId: session!.user.id,
      content,
    })
    .returning();

  return NextResponse.json(newComment, { status: 201 });
});
