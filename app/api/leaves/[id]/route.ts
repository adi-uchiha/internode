import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leaveRequests } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

// Admin update HR leave state (approve, reject)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const { status } = body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    const [updatedLeave] = await db
      .update(leaveRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    if (!updatedLeave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error('Error updating leave request:', error);
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

    // Admins can delete any, users can only delete their own
    const existingLeave = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
    });

    if (!existingLeave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (session.user.role !== 'admin' && existingLeave.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [deletedLeave] = await db
      .delete(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .returning();

    return NextResponse.json({ success: true, deletedLeave });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
