import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, organizations, projects } from '@/db/schema';
import { desc, eq, and, sql, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request, { orgId }) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const assigneeId = searchParams.get('assigneeId');

  if (!orgId) return NextResponse.json([]);

  const queryConditions = [eq(tickets.organizationId, orgId)];
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
  const body = await request.json();
  const {
    title,
    description,
    status,
    priority,
    projectIds: bodyProjectIds,
    assigneeId,
    estimatedHours,
    dueDate,
    labels,
  } = body;

  if (!orgId) throw new Error('No active organization');

  // Atomically increment the org's ticket counter and get the new value.
  // Using SQL UPDATE...RETURNING so concurrent requests never produce
  // duplicate numbers.
  const [updatedOrg] = await db
    .update(organizations)
    .set({
      ticketCounter: sql`${organizations.ticketCounter} + 1`,
    })
    .where(eq(organizations.id, orgId))
    .returning({ ticketCounter: organizations.ticketCounter });

  if (!updatedOrg) throw new Error('Organization not found');

  const sequentialTicketId = `TASK${updatedOrg.ticketCounter}`;

  const [newTicket] = await db
    .insert(tickets)
    .values({
      id: nanoid(),
      organizationId: orgId,
      ticketId: sequentialTicketId,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      projectIds: bodyProjectIds || [],
      assigneeId: assigneeId || null,
      createdById: session!.user.id,
      estimatedHours: estimatedHours || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels || [],
    })
    .returning();

  return NextResponse.json(newTicket, { status: 201 });
});
