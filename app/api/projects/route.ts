import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  // Fetch all projects, optionally ordered by created at
  const allProjects = await db.query.projects.findMany({
    orderBy: [desc(projects.createdAt)],
  });

  return NextResponse.json(allProjects);
});

export const POST = withErrorHandler(
  async (req) => {
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
  },
  { requiredRole: 'admin' }
);
