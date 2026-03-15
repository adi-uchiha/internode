import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, organizations, projects } from '@/db/schema';
import { desc, eq, and, sql, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-error';
import { createTicketSchema } from '@/lib/validations/tickets';

export const GET = withErrorHandler(async (request, { orgId }) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const assigneeId = searchParams.get('assigneeId');

  const queryConditions = [eq(tickets.organizationId, orgId!)];
  if (projectId)
    queryConditions.push(sql`${tickets.projectIds} @> ${JSON.stringify([projectId])}::jsonb`);
  if (assigneeId) queryConditions.push(eq(tickets.assigneeId, assigneeId));

  const whereClause = and(...queryConditions);

  const allTickets = await db.query.tickets.findMany({
    where: whereClause,
    with: {
      assignee: true,
      createdBy: true,
      timeLogs: {
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(tickets.createdAt)],
  });

  // Resolve project names from projectIds
  const allProjectIds = [...new Set(allTickets.flatMap((t) => t.projectIds || []))];
  let projectMap: Record<string, { id: string; name: string }> = {};
  if (allProjectIds.length > 0) {
    const projectRows = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(inArray(projects.id, allProjectIds));
    projectMap = Object.fromEntries(projectRows.map((p) => [p.id, p]));
  }

  const ticketsWithProjects = allTickets.map((t) => ({
    ...t,
    projects: (t.projectIds || [])
      .map((pid) => projectMap[pid])
      .filter((p): p is { id: string; name: string } => !!p),
  }));

  return NextResponse.json(ticketsWithProjects);
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

  const [newTicket] = await db
    .insert(tickets)
    .values({
      id: nanoid(),
      organizationId: orgId!,
      ticketId: sequentialTicketId,
      title: body.title,
      description: body.description || '',
      status: body.status,
      priority: body.priority,
      projectIds: body.projectIds,
      assigneeId: body.assigneeId,
      createdById: session!.user.id,
      estimatedHours: body.estimatedHours,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      labels: body.labels,
    })
    .returning();

  return NextResponse.json(newTicket, { status: 201 });
});
