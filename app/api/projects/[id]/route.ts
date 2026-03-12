import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';

export const DELETE = withErrorHandler(
  async (req, { params }) => {
    const { id } = await params;
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
