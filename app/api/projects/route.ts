import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { createProjectSchema } from '@/lib/validations/projects';

export const GET = withErrorHandler(async (request, { orgId }) => {
  const allProjects = await db.query.projects.findMany({
    where: eq(projects.organizationId, orgId!),
    orderBy: [desc(projects.createdAt)],
  });

  return NextResponse.json(allProjects);
});

export const POST = withErrorHandler(
  async (req, { orgId }) => {
    const json = await req.json();
    const body = createProjectSchema.parse(json);
    const id = `proj_${Math.random().toString(36).slice(2, 9)}`;

    const [newProject] = await db
      .insert(projects)
      .values({
        id,
        organizationId: orgId!,
        name: body.name,
        prefix: body.prefix || body.name.slice(0, 3).toUpperCase(),
        description: body.description || '',
        color: body.color,
        status: body.status,
        startDate: new Date(body.startDate),
      })
      .returning();

    return NextResponse.json(newProject);
  },
  { requiredRole: 'admin' }
);
