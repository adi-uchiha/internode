import { db } from '@/db';
import { breakthroughs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { nanoid } from 'nanoid';
import { createBreakthroughSchema } from '@/lib/validations/breakthroughs';

export const GET = withErrorHandler(async (request, { orgId }) => {
  const data = await db.query.breakthroughs.findMany({
    where: eq(breakthroughs.organizationId, orgId!),
    orderBy: [desc(breakthroughs.date)],
    with: {
      user: true,
      project: true,
    },
  });

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (req, { session, orgId }) => {
  const json = await req.json();
  const body = createBreakthroughSchema.parse(json);

  const [newBreakthrough] = await db
    .insert(breakthroughs)
    .values({
      id: nanoid(),
      organizationId: orgId!,
      userId: session!.user.id,
      title: body.title,
      description: body.description,
      skillTags: body.skillTags || [],
      prLink: body.prLink,
      projectId: body.projectId,
      date: new Date(body.date),
    })
    .returning();

  return NextResponse.json(newBreakthrough);
});
