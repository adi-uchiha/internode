import { NextResponse } from 'next/server';
import { db } from '@/db';
import { goalItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError, NotFoundError } from '@/lib/api-error';

import { getActiveOrgId } from '@/lib/api-utils';

// Toggle completion status or edit text of a goal item
export const PATCH = withErrorHandler(async (request, { params, session }) => {
  const { id } = await params;
  const body = await request.json();

  const updateData: { completed?: boolean; text?: string } = {};
  if (body.completed !== undefined) updateData.completed = body.completed as boolean;
  if (body.text !== undefined) updateData.text = body.text as string;

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError('No data to update');
  }

  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) throw new Error('No organization found for user');

  // Verify ownership and organization
  const existingItem = await db.query.goalItems.findFirst({
    where: eq(goalItems.id, id),
    with: {
      weeklyGoal: true,
    },
  });

  if (
    !existingItem ||
    existingItem.weeklyGoal.userId !== session!.user.id ||
    existingItem.weeklyGoal.organizationId !== orgId
  ) {
    throw new NotFoundError('Goal item not found');
  }

  const [updatedItem] = await db
    .update(goalItems)
    .set(updateData)
    .where(eq(goalItems.id, id))
    .returning();

  return NextResponse.json(updatedItem);
});

export const DELETE = withErrorHandler(async (request, { params, session }) => {
  const { id } = await params;

  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) throw new Error('No organization found for user');

  // Verify ownership and organization
  const existingItem = await db.query.goalItems.findFirst({
    where: eq(goalItems.id, id),
    with: {
      weeklyGoal: true,
    },
  });

  if (
    !existingItem ||
    existingItem.weeklyGoal.userId !== session!.user.id ||
    existingItem.weeklyGoal.organizationId !== orgId
  ) {
    throw new NotFoundError('Goal item not found');
  }

  const [deletedItem] = await db.delete(goalItems).where(eq(goalItems.id, id)).returning();

  return NextResponse.json({ success: true, deletedItem });
});
