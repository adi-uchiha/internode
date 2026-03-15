import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, projects } from '@/db/schema';
import { eq, and, inArray, type InferSelectModel } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { updateTicketSchema } from '@/lib/validations/tickets';
import { NotificationService } from '@/lib/notifications';

export const GET = withErrorHandler(async (request, { params, orgId }) => {
  const { id } = await params;

  // Check if ID is a PK (nanoid, >15 chars) or a ticketId (like TASK1, TASK42)
  const isPk = id.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

  const ticket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId!)),
    with: {
      assignee: true,
      createdBy: true,
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

  // Resolve project names from projectIds
  const ticketProjectIds = ticket.projectIds || [];
  let resolvedProjects: { id: string; name: string }[] = [];
  if (ticketProjectIds.length > 0) {
    const projectRows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(inArray(projects.id, ticketProjectIds));
    resolvedProjects = ticketProjectIds
      .map((pid) => projectRows.find((p) => p.id === pid))
      .filter((p): p is { id: string; name: string } => !!p);
  }

  return NextResponse.json({ ...ticket, projects: resolvedProjects });
});

export const PATCH = withErrorHandler(async (request, { params, session, orgId }) => {
  const { id } = await params;
  const json = await request.json();
  const body = updateTicketSchema.parse(json);

  // Check if ID is a PK (nanoid) or a ticketId (TASK{N})
  const isPk = id.length > 15;
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

  const existingTicket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId!)),
  });

  if (!existingTicket) {
    throw new NotFoundError('Ticket not found');
  }

  const updateData: Partial<InferSelectModel<typeof tickets>> & { loggedHours?: number } = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
  if (body.labels !== undefined) updateData.labels = body.labels;
  if (body.projectIds !== undefined) updateData.projectIds = body.projectIds;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  // Aggregate logged hours if incrementing
  if (body.addLoggedHours !== undefined) {
    updateData.loggedHours = (existingTicket.loggedHours || 0) + body.addLoggedHours;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(existingTicket);
  }

  updateData.updatedAt = new Date();

  const [updatedTicketRaw] = await db
    .update(tickets)
    .set(updateData)
    .where(and(ticketQuery, eq(tickets.organizationId, orgId!)))
    .returning();

  // --- Notification Triggers ---
  if (updatedTicketRaw) {
    const ticketIdForService = updatedTicketRaw.id;
    const ticketShortId = updatedTicketRaw.ticketId;
    const ticketTitle = updatedTicketRaw.title;

    // 1. Assignment Notification
    if (body.assigneeId !== undefined && body.assigneeId !== existingTicket.assigneeId) {
      if (body.assigneeId) {
        await NotificationService.notifyAssignment({
          organizationId: orgId!,
          ticketId: ticketIdForService,
          ticketTitle: ticketTitle,
          assigneeId: body.assigneeId,
          assignerName: session!.user.name || 'Admin',
        });
      }
    }

    // 2. Status Change Notification
    if (body.status !== undefined && body.status !== existingTicket.status) {
      await NotificationService.notifyTicketEvent({
        organizationId: orgId!,
        ticketId: ticketIdForService,
        type: 'status',
        title: 'Status Updated',
        subtitle: `[${ticketShortId}] Moved to ${body.status.toUpperCase()}`,
        excludeUserId: session!.user.id,
      });
    }
  }

  // Fetch full ticket with relations to reconcile cache (Blueprint 9.2)
  const fullTicket = await db.query.tickets.findFirst({
    where: eq(tickets.id, updatedTicketRaw.id),
    with: {
      assignee: true,
      createdBy: true,
      timeLogs: {
        with: {
          user: true,
        },
        orderBy: (logs, { desc }) => [desc(logs.date)],
      },
      comments: {
        with: {
          user: true,
        },
        orderBy: (c, { desc }) => [desc(c.createdAt)],
      },
    },
  });

  // Resolve project names from projectIds (matches GET /tickets logic)
  const ticketProjectIds = fullTicket?.projectIds || [];
  let resolvedProjects: { id: string; name: string }[] = [];
  if (ticketProjectIds.length > 0) {
    const projectRows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(inArray(projects.id, ticketProjectIds));
    resolvedProjects = ticketProjectIds
      .map((pid) => projectRows.find((p) => p.id === pid))
      .filter((p): p is { id: string; name: string } => !!p);
  }

  return NextResponse.json({ ...fullTicket, projects: resolvedProjects });
});

export const DELETE = withErrorHandler(
  async (request, { params, orgId }) => {
    const { id } = await params;

    // Check if ID is a PK (nanoid) or a ticketId (TASK{N})
    const isPk = id.length > 15;
    const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id);

    const [deletedTicket] = await db
      .delete(tickets)
      .where(and(ticketQuery, eq(tickets.organizationId, orgId!)))
      .returning();

    if (!deletedTicket) {
      throw new NotFoundError('Ticket not found');
    }

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  },
  { requiredRole: 'admin' }
);
