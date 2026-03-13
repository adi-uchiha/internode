import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';

export const GET = withErrorHandler(async (request, { params, orgId }) => {
  const { id } = await params;

  // Check if ID is a PK or a ticketId (like INT-1234)
  const isPk = id.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

  if (!orgId) throw new Error('No active organization');

  const ticket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId)),
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
    throw new NotFoundError('Ticket not found');
  }

  return NextResponse.json(ticket);
});

export const PATCH = withErrorHandler(async (request, { params, orgId }) => {
  const { id } = await params;
  const body = await request.json();

  // Check if ID is a PK or a ticketId
  const isPk = id.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

  if (!orgId) throw new Error('No active organization');

  const existingTicket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId)),
  });

  if (!existingTicket) {
    throw new NotFoundError('Ticket not found');
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
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  // Add logged hours if incrementing
  if (body.addLoggedHours !== undefined) {
    updateData.loggedHours = (existingTicket.loggedHours || 0) + body.addLoggedHours;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(existingTicket);
  }

  updateData.updatedAt = new Date();

  const [updatedTicket] = await db
    .update(tickets)
    .set(updateData)
    .where(and(ticketQuery, eq(tickets.organizationId, orgId)))
    .returning();

  return NextResponse.json(updatedTicket);
});
