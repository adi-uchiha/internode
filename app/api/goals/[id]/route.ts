import { NextResponse } from 'next/server';
import { db } from '@/db';
import { goalItems } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

// Toggle completion status or edit text of a goal item
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: { completed?: boolean; text?: string } = {};
    if (body.completed !== undefined) updateData.completed = body.completed as boolean;
    if (body.text !== undefined) updateData.text = body.text as string;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const [updatedItem] = await db
      .update(goalItems)
      .set(updateData)
      .where(eq(goalItems.id, id))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Goal item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating goal item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const [deletedItem] = await db.delete(goalItems).where(eq(goalItems.id, id)).returning();

    if (!deletedItem) {
      return NextResponse.json({ error: 'Goal item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedItem });
  } catch (error) {
    console.error('Error deleting goal item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
