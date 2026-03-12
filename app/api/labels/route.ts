import { NextResponse } from 'next/server';
import { db } from '@/db';
import { labels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

export const GET = withErrorHandler(async () => {
  const allLabels = await db.query.labels.findMany({
    orderBy: (labels, { asc }) => [asc(labels.name)],
  });
  return NextResponse.json(allLabels);
});

export const POST = withErrorHandler(
  async (req) => {
    const { name, color } = await req.json();

    if (!name || !color) {
      throw new BadRequestError('Name and color are required');
    }

    const newLabel = await db
      .insert(labels)
      .values({
        id: uuidv4(),
        name,
        color,
      })
      .returning();

    return NextResponse.json(newLabel[0]);
  },
  { requiredRole: 'admin' }
);

export const DELETE = withErrorHandler(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new BadRequestError('ID is required');
    }

    await db.delete(labels).where(eq(labels.id, id));
    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
