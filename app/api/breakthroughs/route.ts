import { db } from '@/db';
import { breakthroughs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request, { orgId }) => {
  if (!orgId) return NextResponse.json([]);

  const data = await db.query.breakthroughs.findMany({
    where: eq(breakthroughs.organizationId, orgId),
    orderBy: [desc(breakthroughs.date)],
    with: {
      user: true,
      project: true,
    },
  });

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (req, { session, orgId }) => {
  const body = await req.json();
  const { title, description, skillTags, prLink, projectId } = body;

  if (!orgId) throw new Error('No active organization');

  const [newBreakthrough] = await db
    .insert(breakthroughs)
    .values({
      id: crypto.randomUUID(), // breakthroughs uses uuid
      organizationId: orgId,
      userId: session!.user.id,
      title,
      description,
      skillTags,
      prLink,
      projectId,
    })
    .returning();

  return NextResponse.json(newBreakthrough);
});
