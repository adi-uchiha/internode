import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  tickets,
  organizations,
  ticketProjects,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} from '@/db/schema';
import { desc, eq, and, sql, exists } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { createTicketSchema } from '@/lib/validations/tickets';

export const GET = withErrorHandler(async (request, { orgId }) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const assigneeId = searchParams.get('assigneeId');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const queryConditions = [eq(tickets.organizationId, orgId!)];

  if (projectId) {
    queryConditions.push(
      exists(
        db
          .select()
          .from(ticketProjects)
          .where(
            and(eq(ticketProjects.ticketId, tickets.id), eq(ticketProjects.projectId, projectId))
          )
      )
    );
  }

  if (assigneeId) queryConditions.push(eq(tickets.assigneeId, assigneeId));
  if (status) queryConditions.push(eq(tickets.status, status as (typeof TICKET_STATUSES)[number]));
  if (priority)
    queryConditions.push(eq(tickets.priority, priority as (typeof TICKET_PRIORITIES)[number]));

  const whereClause = and(...queryConditions);

  const allTickets = await db.query.tickets.findMany({
    where: whereClause,
    limit,
    offset,
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
        limit: 5,
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(tickets.createdAt)],
  });

  const formattedTickets = allTickets.map((t) => ({
    ...t,
    projects: t.projects.map((p) => p.project),
  }));

  return NextResponse.json(formattedTickets);
});

export const POST = withErrorHandler(async (request, { session, orgId }) => {
  const json = await request.json();
  const body = createTicketSchema.parse(json);

  // Atomically increment the org's ticket counter and get the new value.
  const [updatedOrg] = await db
    .update(organizations)
    .set({
      ticketCounter: sql`${organizations.ticketCounter} + 1`,
    })
    .where(eq(organizations.id, orgId!))
    .returning({ ticketCounter: organizations.ticketCounter });

  if (!updatedOrg) {
    throw new NotFoundError('Organization not found', 'org_not_found');
  }

  const sequentialTicketId = `TASK${updatedOrg.ticketCounter}`;

  const [newTicketRaw] = await db
    .insert(tickets)
    .values({
      id: nanoid(),
      organizationId: orgId!,
      ticketId: sequentialTicketId,
      title: body.title,
      description: body.description || '',
      status: body.status,
      priority: body.priority,
      assigneeId: body.assigneeId,
      createdById: session!.user.id,
      estimatedHours: body.estimatedHours,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      labels: body.labels,
    })
    .returning();

  // Handle projects junction table
  if (body.projectIds && body.projectIds.length > 0) {
    await db.insert(ticketProjects).values(
      body.projectIds.map((projectId) => ({
        ticketId: newTicketRaw.id,
        projectId,
        organizationId: orgId!,
      }))
    );
  }

  // Fetch full ticket with relations to reconcile cache (Blueprint 10)
  const fullTicket = await db.query.tickets.findFirst({
    where: eq(tickets.id, newTicketRaw.id),
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
      },
    },
  });

  const formattedTicket = fullTicket
    ? {
        ...fullTicket,
        projects: fullTicket.projects.map((p) => p.project),
      }
    : null;

  return NextResponse.json(formattedTicket, { status: 201 });
});
