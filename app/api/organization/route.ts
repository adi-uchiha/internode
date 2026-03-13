import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { orgId }) => {
  if (!orgId) return NextResponse.json({ organizationName: '', organizationDomain: '' });

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  return NextResponse.json({
    organizationName: org?.name || '',
    organizationDomain: org?.slug || '',
  });
});

export const PATCH = withErrorHandler(
  async (req, { orgId }) => {
    const body = await req.json();
    const { organizationName, organizationDomain } = body;

    if (!orgId) throw new Error('No active organization');

    await db
      .update(organizations)
      .set({
        name: organizationName,
        slug: organizationDomain,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true });
  },
  { requiredRole: ['owner', 'admin'] }
);
