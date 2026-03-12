import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all projects, optionally ordered by created at
  try {
    const allProjects = await db.query.projects.findMany({
      orderBy: [desc(projects.createdAt)],
    });

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const id = data.id || `proj_${Math.random().toString(36).slice(2, 9)}`;

    const newProject = await db
      .insert(projects)
      .values({
        id,
        name: data.name,
        prefix: data.prefix || data.name.slice(0, 3).toUpperCase(),
        description: data.description || '',
        color: data.color || '#3b82f6',
        status: data.status || 'active',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
      })
      .returning();

    return NextResponse.json(newProject[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
