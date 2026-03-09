import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyLogs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userIdQuery = searchParams.get('userId');

  try {
    const isAdmin = session.user.role === 'admin';
    // If admin and NO specific id requested, return all logs
    // If admin and specific id requested, return that id's logs
    // If member, ALWAYS return only their logs
    let condition = undefined;
    if (isAdmin && userIdQuery) {
      condition = eq(dailyLogs.userId, userIdQuery);
    } else if (!isAdmin) {
      condition = eq(dailyLogs.userId, session.user.id);
    } // else (isAdmin && !userIdQuery) -> condition remains undefined

    const logs = await db.query.dailyLogs.findMany({
      where: condition,
      orderBy: [desc(dailyLogs.date)],
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      date,
      whatIDid,
      whatILearned,
      hoursWorked,
      blockers,
      hasBlocker,
      isBreakthrough,
      skillTags,
      prLinks,
      docLinks,
      projectId,
      status, // 'draft' or 'submitted'
    } = body;

    const [newLog] = await db
      .insert(dailyLogs)
      .values({
        id: nanoid(),
        userId: session.user.id,
        date: new Date(date),
        whatIDid,
        whatILearned: whatILearned || '',
        hoursWorked: hoursWorked || 0,
        blockers,
        hasBlocker: !!hasBlocker || !!blockers,
        isBreakthrough: !!isBreakthrough,
        skillTags: skillTags || [],
        prLinks: prLinks || [],
        docLinks: docLinks || [],
        projectId,
        status: status || 'submitted',
      })
      .returning();

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
