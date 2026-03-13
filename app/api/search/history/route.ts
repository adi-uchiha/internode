import { db } from '@/db';
import { searchHistory } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { session, orgId }) => {
  if (!orgId) return NextResponse.json([]);

  const history = await db.query.searchHistory.findMany({
    where: and(eq(searchHistory.userId, session!.user.id), eq(searchHistory.organizationId, orgId)),
    orderBy: [desc(searchHistory.lastAccessedAt)],
    limit: 5,
  });

  return NextResponse.json(history);
});

export const POST = withErrorHandler(async (req, { session, orgId }) => {
  const body = await req.json();
  const { entityType, entityId, title, subtitle } = body;

  if (!orgId) throw new Error('No active organization');

  // UPSERT logic for history
  const [existing] = await db
    .select()
    .from(searchHistory)
    .where(and(eq(searchHistory.entityId, entityId), eq(searchHistory.organizationId, orgId)));

  if (existing) {
    await db
      .update(searchHistory)
      .set({ lastAccessedAt: new Date() })
      .where(eq(searchHistory.id, existing.id));
    return NextResponse.json(existing);
  }

  const [newItem] = await db
    .insert(searchHistory)
    .values({
      userId: session!.user.id,
      organizationId: orgId,
      entityType,
      entityId,
      title,
      subtitle,
    })
    .returning();

  return NextResponse.json(newItem);
});
