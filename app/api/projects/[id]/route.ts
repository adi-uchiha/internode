import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

import { getActiveOrgId } from '@/lib/api-utils';

export const DELETE = withErrorHandler(
  async (req, { params, session }) => {
    const { id } = await params;

    const orgId = await getActiveOrgId(session!.user.id);
    if (!orgId) throw new Error('No organization found for user');

    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.organizationId, orgId)));
    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
