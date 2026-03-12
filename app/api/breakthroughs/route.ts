import { db } from '@/db';
import { breakthroughs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  const data = await db.query.breakthroughs.findMany({
    orderBy: [desc(breakthroughs.date)],
    with: {
      user: true,
      project: true,
    },
  });

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (req, { session }) => {
  if (!session) throw new Error('Session is required'); // Should not happen with withErrorHandler

  const body = await req.json();
  const { title, description, skillTags, prLink, projectId } = body;

  const [newBreakthrough] = await db
    .insert(breakthroughs)
    .values({
      userId: session.user.id,
      title,
      description,
      skillTags,
      prLink,
      projectId,
    })
    .returning();

  return NextResponse.json(newBreakthrough);
});
