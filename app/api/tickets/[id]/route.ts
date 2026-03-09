import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if ID is a PK or a ticketId (like INT-1234)
    const isPk = id.length > 15;

    const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

    const ticket = await db.query.tickets.findFirst({
      where: ticketQuery,
      with: {
        assignee: true,
        createdBy: true,
        project: true,
        timeLogs: {
          with: {
            user: true,
          },
          orderBy: (timeLogs, { desc }) => [desc(timeLogs.createdAt)],
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    // Check if ID is a PK or a ticketId
    const isPk = id.length > 15;
    const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

    const existingTicket = await db.query.tickets.findFirst({
      where: ticketQuery,
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updateData: Partial<typeof tickets.$inferInsert> & { addLoggedHours?: number } = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
    if (body.loggedHours !== undefined) updateData.loggedHours = body.loggedHours;
    if (body.labels !== undefined) updateData.labels = body.labels;
    if (body.projectId !== undefined) updateData.projectId = body.projectId;
    if (body.dueDate !== undefined)
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    // Add logged hours if incrementing
    if (body.addLoggedHours !== undefined) {
      updateData.loggedHours = (existingTicket.loggedHours || 0) + body.addLoggedHours;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingTicket);
    }

    updateData.updatedAt = new Date();

    const [updatedTicket] = await db.update(tickets).set(updateData).where(ticketQuery).returning();

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
