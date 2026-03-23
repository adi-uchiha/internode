import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, users, organizations, ticketProjects } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { updateTicketSchema } from '@/lib/validations/tickets';
import { sanitizeHtml } from '@/lib/sanitizer';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';

export const GET = withErrorHandler(async (request, { params, orgId }) => {
  const { id } = await params;

  // Check if ID is a PK or a ticketId (like VELO-1, TEST-42)
  const isPk = !id.includes('-');
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id.toUpperCase());

  const ticket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId!)),
    with: {
      assignee: true,
      createdBy: true,
      projects: {
        with: {
          project: {
            columns: {
              id: true,
              name: true,
              prefix: true,
              color: true,
            },
          },
        },
      },
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

  const formattedTicket = {
    ...ticket,
    projects: ticket.projects.map((p) => p.project),
  };

  return NextResponse.json(formattedTicket);
});

export const PATCH = withErrorHandler(async (request, { params, session, orgId }) => {
  const { id } = await params;
  const json = await request.json();
  const body = updateTicketSchema.parse(json);

  // Check if ID is a PK or a ticketId (like VELO-1, TEST-42)
  const isPk = !id.includes('-');
  const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id.toUpperCase());

  const existingTicket = await db.query.tickets.findFirst({
    where: and(ticketQuery, eq(tickets.organizationId, orgId!)),
  });

  if (!existingTicket) {
    throw new NotFoundError('Ticket not found');
  }

  const updateData: Partial<typeof tickets.$inferInsert> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) {
    updateData.description = body.description ? sanitizeHtml(body.description) : '';
  }
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.estimatedHours !== undefined) updateData.estimatedHours = body.estimatedHours;
  if (body.labels !== undefined) updateData.labels = body.labels;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  // Aggregate logged hours if incrementing (Atomic increment to avoid race conditions)
  if (body.addLoggedHours !== undefined) {
    // @ts-expect-error - drizzle requires number for type but accepts SQL for runtime updates
    updateData.loggedHours = sql`${tickets.loggedHours} + ${body.addLoggedHours}`;
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

  // Sync projects junction table
  if (body.projectIds !== undefined) {
    await db.transaction(async (tx) => {
      // Delete existing
      await tx.delete(ticketProjects).where(eq(ticketProjects.ticketId, updatedTicketRaw.id));

      // Insert new
      if (body.projectIds && body.projectIds.length > 0) {
        await tx.insert(ticketProjects).values(
          body.projectIds.map((projectId) => ({
            ticketId: updatedTicketRaw.id,
            projectId,
            organizationId: orgId!,
          }))
        );
      }
    });
  }

  // --- Email + Notification Triggers (fire-and-forget) ---
  if (updatedTicketRaw) {
    const ticketShortId = updatedTicketRaw.ticketId;
    const ticketTitle = updatedTicketRaw.title;
    const ticketUrl = `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${ticketShortId}`;

    // Fetch org name once for emails
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId!),
      columns: { name: true },
    });
    const organizationName = org?.name ?? 'Your Organization';

    // 1. Ticket Assigned — new assignee differs from previous
    if (body.assigneeId !== undefined && body.assigneeId !== existingTicket.assigneeId) {
      if (body.assigneeId) {
        const assignee = await db.query.users.findFirst({
          where: eq(users.id, body.assigneeId),
          columns: { email: true, name: true },
        });

        if (assignee) {
          void EmailService.ticketAssigned({
            organizationId: orgId!,
            assigneeId: body.assigneeId,
            assigneeEmail: assignee.email,
            payload: {
              to: assignee.email,
              organizationName,
              assigneeName: assignee.name,
              assignerName: session!.user.name || session!.user.email,
              ticketShortId,
              ticketId: existingTicket.id,
              ticketTitle,
              ticketUrl,
            },
          });
        }
      }
    }

    // 2. Status Changed — notify creator + assignee (not the actor)
    if (body.status !== undefined && body.status !== existingTicket.status) {
      // Collect recipients: original creator + original assignee
      const recipientIds = [
        existingTicket.createdById,
        existingTicket.assigneeId,
        // Also notify the new assignee if one was just set
        body.assigneeId ?? null,
      ].filter((uid): uid is string => !!uid && uid !== session!.user.id);

      const uniqueIds = [...new Set(recipientIds)];

      if (uniqueIds.length > 0) {
        const recipientRows = await db
          .select({ id: users.id, email: users.email, name: users.name })
          .from(users)
          .where(inArray(users.id, uniqueIds));

        void EmailService.ticketStatusChanged({
          organizationId: orgId!,
          ticketId: updatedTicketRaw.id,
          excludeUserId: session!.user.id,
          recipients: recipientRows.map((r) => ({
            userId: r.id,
            email: r.email,
            name: r.name,
          })),
          payload: {
            to: [],
            organizationName,
            recipientName: '',
            ticketShortId,
            ticketTitle,
            oldStatus: existingTicket.status,
            newStatus: body.status,
            changedByName: session!.user.name || session!.user.email,
            ticketUrl,
          },
        });
      }
    }
  }

  // Fetch full ticket with relations to reconcile cache (Blueprint 9.2)
  const fullTicket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, updatedTicketRaw.id), eq(tickets.organizationId, orgId!)),
    with: {
      assignee: true,
      createdBy: true,
      projects: {
        with: {
          project: {
            columns: {
              id: true,
              name: true,
              prefix: true,
              color: true,
            },
          },
        },
      },
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

  const formattedTicket = fullTicket
    ? {
        ...fullTicket,
        projects: fullTicket.projects.map((p) => p.project),
      }
    : null;

  return NextResponse.json(formattedTicket);
});

export const DELETE = withErrorHandler(
  async (request, { params, orgId }) => {
    const { id } = await params;

    // Check if ID is a PK or a ticketId (like VELO-1, TEST-42)
    const isPk = !id.includes('-');
    const ticketQuery = isPk ? eq(tickets.id, id) : eq(tickets.ticketId, id.toUpperCase());

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
