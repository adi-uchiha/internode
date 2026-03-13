import { db } from '@/db';
import { searchHistory } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

import { getActiveOrgId } from '@/lib/api-utils';

export const GET = withErrorHandler(async (req, { session }) => {
  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) return NextResponse.json([]);

  const history = await db.query.searchHistory.findMany({
    where: and(eq(searchHistory.userId, session!.user.id), eq(searchHistory.organizationId, orgId)),
    orderBy: [desc(searchHistory.lastAccessedAt)],
    limit: 5,
  });

  return NextResponse.json(history);
});

export const POST = withErrorHandler(async (req, { session }) => {
  const body = await req.json();
  const { entityType, entityId, title, subtitle } = body;

  // UPSERT logic for history
  const [existing] = await db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.entityId, entityId));

  if (existing) {
    await db
      .update(searchHistory)
      .set({ lastAccessedAt: new Date() })
      .where(eq(searchHistory.id, existing.id));
    return NextResponse.json(existing);
  }

  const orgId = await getActiveOrgId(session!.user.id);
  if (!orgId) throw new Error('No organization found for user');

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
