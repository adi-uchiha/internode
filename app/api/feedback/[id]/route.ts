import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

export const POST = withErrorHandler(
  async (request, { params }) => {
    const { id } = await params;
    const body = await request.json();
    const { type, comment } = body;

    if (type === 'log') {
      await db.update(timeLogs).set({ adminComment: comment }).where(eq(timeLogs.id, id));
    } else if (type === 'breakthrough') {
      await db.update(breakthroughs).set({ adminComment: comment }).where(eq(breakthroughs.id, id));
    } else {
      throw new BadRequestError('Invalid type');
    }

    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
