import { NextResponse } from 'next/server';
import { db } from '@/db';
import { labels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';
import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(async (request, { session }) => {
  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) return NextResponse.json([]);

  const allLabels = await db.query.labels.findMany({
    where: eq(labels.organizationId, orgId),
    orderBy: (labels, { asc }) => [asc(labels.name)],
  });
  return NextResponse.json(allLabels);
});

export const POST = withErrorHandler(
  async (req, { session }) => {
    const { name, color } = await req.json();

    if (!name || !color) {
      throw new BadRequestError('Name and color are required');
    }

    const orgId = await getActiveOrgId(session!.user.id);
    if (!orgId) throw new Error('No organization found for user');

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
  async (req, { session }) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new BadRequestError('ID is required');
    }

    const orgId = await getActiveOrgId(session!.user.id);
    if (!orgId) throw new Error('No organization found for user');

    await db.delete(labels).where(and(eq(labels.id, id), eq(labels.organizationId, orgId)));
    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
