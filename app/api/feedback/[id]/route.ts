import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

export const POST = withErrorHandler(
  async (request, { params, orgId }) => {
    const { id } = await params;
    const body = await request.json();
    const { type, comment } = body;

    if (!orgId) throw new Error('No active organization');

    if (type === 'log') {
      await db
        .update(timeLogs)
        .set({ adminComment: comment })
        .where(and(eq(timeLogs.id, id), eq(timeLogs.organizationId, orgId)));
    } else if (type === 'breakthrough') {
      await db
        .update(breakthroughs)
        .set({ adminComment: comment })
        .where(and(eq(breakthroughs.id, id), eq(breakthroughs.organizationId, orgId)));
    } else {
      throw new BadRequestError('Invalid type');
    }

    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
