import { NextResponse } from 'next/server';
import { db } from '@/db';
import { comments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

export const GET = withErrorHandler(async (request, { params }) => {
  const { id: ticketId } = await params;

  const ticketComments = await db.query.comments.findMany({
    where: eq(comments.ticketId, ticketId),
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

  const [newComment] = await db
    .insert(comments)
    .values({
      id: nanoid(),
      ticketId,
      userId: session!.user.id,
      content,
    })
    .returning();

  return NextResponse.json(newComment, { status: 201 });
});
