import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { desc, eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const assigneeId = searchParams.get('assigneeId');

  try {
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
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
        createdById: session.user.id,
        estimatedHours: estimatedHours || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels || [],
      })
      .returning();

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
