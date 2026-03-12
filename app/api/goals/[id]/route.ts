import { NextResponse } from 'next/server';
import { db } from '@/db';
import { goalItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError, NotFoundError } from '@/lib/api-error';

// Toggle completion status or edit text of a goal item
export const PATCH = withErrorHandler(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();

  const updateData: { completed?: boolean; text?: string } = {};
  if (body.completed !== undefined) updateData.completed = body.completed as boolean;
  if (body.text !== undefined) updateData.text = body.text as string;

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError('No data to update');
  }

  const [updatedItem] = await db
    .update(goalItems)
    .set(updateData)
    .where(eq(goalItems.id, id))
    .returning();

  if (!updatedItem) {
    throw new NotFoundError('Goal item not found');
  }

  return NextResponse.json(updatedItem);
});

export const DELETE = withErrorHandler(async (request, { params }) => {
  const { id } = await params;

  const [deletedItem] = await db.delete(goalItems).where(eq(goalItems.id, id)).returning();

  if (!deletedItem) {
    throw new NotFoundError('Goal item not found');
  }

  return NextResponse.json({ success: true, deletedItem });
});
