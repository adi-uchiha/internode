import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request, { orgId }) => {
  if (!orgId) return NextResponse.json([]);

  const allProjects = await db.query.projects.findMany({
    where: eq(projects.organizationId, orgId),
    orderBy: [desc(projects.createdAt)],
  });

  return NextResponse.json(allProjects);
});

export const POST = withErrorHandler(
  async (req, { orgId }) => {
    const data = await req.json();
    const id = data.id || `proj_${Math.random().toString(36).slice(2, 9)}`;

    if (!orgId) throw new Error('No active organization');

    const newProject = await db
      .insert(projects)
      .values({
        id,
        organizationId: orgId,
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
