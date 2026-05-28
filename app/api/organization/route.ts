import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { getOrgUsage, PlanId } from '@/lib/billing-plans';

export const GET = withErrorHandler(async (req, { orgId }) => {
  if (!orgId)
    return NextResponse.json({ id: '', organizationName: '', organizationDomain: '', logo: null });

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  const plan = (org?.subscriptionPlan ?? 'free') as PlanId;
  const usage = await getOrgUsage(orgId, plan);

  return NextResponse.json({
    id: org?.id || '',
    organizationName: org?.name || '',
    organizationDomain: org?.slug || '',
    logo: org?.logo ?? null,
    billing: {
      plan,
      status: org?.subscriptionStatus ?? 'active',
      customerId: org?.lemonCustomerId ?? null,
      currentPeriodEnd: org?.subscriptionCurrentPeriodEnd
        ? org.subscriptionCurrentPeriodEnd.toISOString()
        : null,
      usage,
    },
  });
});

export const PATCH = withErrorHandler(
  async (req, { orgId }) => {
    const body = await req.json();
    const { organizationName, organizationDomain, logo } = body;

    if (!orgId) throw new Error('No active organization');

    // Validate Cloudinary URL if logo is provided
    const CLOUDINARY_URL_PREFIX = 'https://res.cloudinary.com/';
    const validatedLogo =
      typeof logo === 'string' && logo.startsWith(CLOUDINARY_URL_PREFIX) ? logo : undefined;

    await db
      .update(organizations)
      .set({
        name: organizationName,
        slug: organizationDomain,
        logo: validatedLogo,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    return NextResponse.json({ success: true });
  },
  { requiredRole: ['owner', 'admin'] }
);
