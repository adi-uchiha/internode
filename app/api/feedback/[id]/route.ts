import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { type, comment } = body;

  try {
    if (type === 'log') {
      await db.update(timeLogs).set({ adminComment: comment }).where(eq(timeLogs.id, id));
    } else if (type === 'breakthrough') {
      await db.update(breakthroughs).set({ adminComment: comment }).where(eq(breakthroughs.id, id));
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
