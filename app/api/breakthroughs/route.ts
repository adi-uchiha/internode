import { db } from '@/db';
import { breakthroughs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { nanoid } from 'nanoid';

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

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  // PR Link Validation (if provided)
  if (
    prLink &&
    !prLink.startsWith('https://github.com/') &&
    !prLink.startsWith('https://gitlab.com/')
  ) {
    return NextResponse.json(
      { error: 'Invalid PR link. Must be a GitHub or GitLab URL' },
      { status: 400 }
    );
  }

  // Tags Validation
  const validatedTags = Array.isArray(skillTags)
    ? skillTags
        .filter((t) => typeof t === 'string' && t.startsWith('#'))
        .map((t) => t.toLowerCase())
    : [];

  const [newBreakthrough] = await db
    .insert(breakthroughs)
    .values({
      id: nanoid(),
      organizationId: orgId,
      userId: session!.user.id,
      title,
      description,
      skillTags: validatedTags,
      prLink,
      projectId,
    })
    .returning();

  return NextResponse.json(newBreakthrough);
});
