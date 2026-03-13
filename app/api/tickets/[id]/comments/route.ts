import { NextResponse } from 'next/server';
import { db } from '@/db';
import { comments, tickets } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(async (request, { params, session }) => {
  const { id: ticketId } = await params;

  const orgId = await getActiveOrgId(session!.user.id);
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

export const POST = withErrorHandler(async (request, { params, session }) => {
  const { id: ticketId } = await params;
  const { content } = await request.json();

  if (!content) {
    throw new BadRequestError('Content is required');
  }

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
  });

  if (!ticket) {
    throw new BadRequestError('Ticket not found');
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      id: nanoid(),
      organizationId: ticket.organizationId,
      ticketId,
      userId: session!.user.id,
      content,
    })
    .returning();

  return NextResponse.json(newComment, { status: 201 });
});
