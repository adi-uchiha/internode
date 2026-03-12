import { db } from '@/db';
import { breakthroughs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await db.query.breakthroughs.findMany({
    orderBy: [desc(breakthroughs.date)],
    with: {
      user: true,
      project: true,
    },
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create breakthrough' }, { status: 500 });
  }
}
