import { db } from '@/db';
import { searchHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { session }) => {
  const history = await db.query.searchHistory.findMany({
    where: eq(searchHistory.userId, session!.user.id),
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

  const [newItem] = await db
    .insert(searchHistory)
    .values({
      userId: session!.user.id,
      organizationId:
        (await db.query.members.findFirst({ where: (m, { eq }) => eq(m.userId, session!.user.id) }))
          ?.organizationId || '',
      entityType,
      entityId,
      title,
      subtitle,
    })
    .returning();

  return NextResponse.json(newItem);
});
