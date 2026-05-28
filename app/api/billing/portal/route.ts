import { NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { LEMON_SQUEEZY_API_KEY } from '@/lib/env';

export const GET = withErrorHandler(
  async (req, { orgId }) => {
    if (!orgId) throw new Error('No active organization');

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { lemonCustomerId: true, subscriptionPlan: true },
    });

    if (!org?.lemonCustomerId) {
      // Free plan — no portal, redirect to checkout
      return NextResponse.json({ portalUrl: null, isFree: true });
    }

    try {
      // Call Lemon Squeezy API to get customer portal URL
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/customers/${org.lemonCustomerId}`,
        {
          headers: {
            Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
            Accept: 'application/vnd.api+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Lemon Squeezy API returned status: ${response.status}`);
      }

      const data = await response.json();
      const portalUrl = data?.data?.attributes?.urls?.customer_portal ?? null;

      return NextResponse.json({ portalUrl, isFree: false });
    } catch (error) {
      console.error('[BillingPortal] Failed to fetch customer from Lemon Squeezy:', error);
      return NextResponse.json(
        { error: 'Failed to generate billing portal link' },
        { status: 500 }
      );
    }
  },
  { requiredRole: ['admin', 'owner'] }
);
