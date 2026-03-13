import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const DELETE = withErrorHandler(
  async (req, { params, orgId }) => {
    const { id } = await params;

    if (!orgId) throw new Error('No active organization');

    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.organizationId, orgId)));
    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
