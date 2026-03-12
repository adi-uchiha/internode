import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const assigneeId = searchParams.get('assigneeId');

  const queryConditions = [];
  if (projectId) queryConditions.push(eq(tickets.projectId, projectId));
  if (assigneeId) queryConditions.push(eq(tickets.assigneeId, assigneeId));

  const whereClause = queryConditions.length > 0 ? and(...queryConditions) : undefined;

  const allTickets = await db.query.tickets.findMany({
    where: whereClause,
    with: {
      assignee: true,
      createdBy: true,
      project: true,
      timeLogs: {
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(tickets.createdAt)],
  });

  return NextResponse.json(allTickets);
});

export const POST = withErrorHandler(async (request, { session }) => {
  const body = await request.json();
  const {
    title,
    description,
    status,
    priority,
    projectId,
    assigneeId,
    estimatedHours,
    dueDate,
    labels,
  } = body;

  const [newTicket] = await db
    .insert(tickets)
    .values({
      id: nanoid(),
      ticketId: `INT-${Math.floor(Math.random() * 9000) + 1000}`,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      projectId,
      assigneeId: assigneeId || null,
      createdById: session!.user.id,
      estimatedHours: estimatedHours || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels || [],
    })
    .returning();

  return NextResponse.json(newTicket, { status: 201 });
});
