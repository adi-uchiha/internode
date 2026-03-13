import { NextResponse } from 'next/server';
import { db } from '@/db';
import { labels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

export const GET = withErrorHandler(async (request, { orgId }) => {
  if (!orgId) return NextResponse.json([]);

  const allLabels = await db.query.labels.findMany({
    where: eq(labels.organizationId, orgId),
    orderBy: (labels, { asc }) => [asc(labels.name)],
  });
  return NextResponse.json(allLabels);
});

export const POST = withErrorHandler(
  async (req, { orgId }) => {
    const { name, color } = await req.json();

    if (!name || !color) {
      throw new BadRequestError('Name and color are required');
    }

    if (!orgId) throw new Error('No active organization');

    const newLabel = await db
      .insert(labels)
      .values({
        id: uuidv4(),
        organizationId: orgId,
        name,
        color,
      })
      .returning();

    return NextResponse.json(newLabel[0]);
  },
  { requiredRole: 'admin' }
);

export const DELETE = withErrorHandler(
  async (req, { orgId }) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new BadRequestError('ID is required');
    }

    if (!orgId) throw new Error('No active organization');

    await db.delete(labels).where(and(eq(labels.id, id), eq(labels.organizationId, orgId)));
    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
