import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError } from '@/lib/api-error';

import { getActiveOrgId } from '@/lib/api-utils';

export const POST = withErrorHandler(
  async (request, { params, session }) => {
    const { id } = await params;
    const body = await request.json();
    const { type, comment } = body;

    const orgId = await getActiveOrgId(session!.user.id);
    if (!orgId) throw new Error('No organization found for user');

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
