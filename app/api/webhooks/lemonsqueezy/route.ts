import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/db';
import { organizations, members, users } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { LEMON_SQUEEZY_WEBHOOK_SECRET } from '@/lib/env';
import { LEMON_VARIANT_TO_PLAN, PLAN_LIMITS } from '@/lib/billing-plans';
import { EmailService } from '@/lib/email/service';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  // ── 1. Signature Validation ──────────────────────────────────────────────────
  const expectedSig = createHmac('sha256', LEMON_SQUEEZY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSig !== signature) {
    console.error('[LS Webhook] Invalid signature — rejecting request');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event?.meta?.event_name ?? '';
  const attributes = event?.data?.attributes ?? {};
  const customData = event?.meta?.custom_data ?? {};

  // ── 2. Extract org ID from custom_data ──────────────────────────────────────
  const orgId: string | undefined = customData?.org_id;
  if (!orgId) {
    console.warn('[LS Webhook] Missing org_id in custom_data:', event?.meta);
    return new NextResponse('OK', { status: 200 });
  }

  const lemonSubscriptionId = String(event?.data?.id ?? '');
  const lemonCustomerId = String(attributes?.customer_id ?? '');
  const variantId = String(attributes?.variant_id ?? '');
  const renewsAt = attributes?.renews_at ? new Date(attributes.renews_at) : null;
  const endsAt = attributes?.ends_at ? new Date(attributes.ends_at) : null;

  // ── 3. Map variant → plan tier ───────────────────────────────────────────────
  const plan = LEMON_VARIANT_TO_PLAN[variantId] ?? 'pro'; // fallback to pro if custom variant is added

  // Fetch active admin/owner members of this organization to notify
  const getAdmins = async () => {
    try {
      return await db
        .select({
          userId: users.id,
          email: users.email,
          name: users.name,
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(and(eq(members.organizationId, orgId), inArray(members.role, ['owner', 'admin'])));
    } catch (e) {
      console.error('[LS Webhook] Failed to fetch organization admins:', e);
      return [];
    }
  };

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { name: true },
  });

  const orgName = org?.name || 'Your Organization';

  // ── 4. Event Handlers ────────────────────────────────────────────────────────
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_plan_changed':
    case 'subscription_payment_success':
    case 'subscription_payment_recovered':
      await db
        .update(organizations)
        .set({
          subscriptionPlan: plan,
          subscriptionStatus: 'active',
          lemonSubscriptionId,
          lemonCustomerId,
          subscriptionCurrentPeriodEnd: renewsAt,
        })
        .where(eq(organizations.id, orgId));

      // Trigger Upgraded Email to organization admins
      const adminsToNotify = await getAdmins();
      if (adminsToNotify.length > 0) {
        const limits = PLAN_LIMITS[plan];
        const primaryAdmin = adminsToNotify[0]; // use primary for the greeting name
        void EmailService.subscriptionUpgraded({
          recipients: adminsToNotify,
          payload: {
            to: adminsToNotify.map((a) => a.email),
            organizationName: orgName,
            adminName: primaryAdmin.name || 'Admin',
            planName: plan === 'enterprise' ? 'Enterprise' : 'Pro Growth',
            maxMembers: limits.maxMembers === 999999 ? 'Unlimited' : String(limits.maxMembers),
            maxProjects: limits.maxProjects === 999999 ? 'Unlimited' : String(limits.maxProjects),
            billingPortalUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks/settings#billing`,
          },
        });
      }
      break;

    case 'subscription_cancelled':
    case 'subscription_paused':
      await db
        .update(organizations)
        .set({
          subscriptionStatus: 'canceled',
          subscriptionCurrentPeriodEnd: endsAt,
        })
        .where(eq(organizations.id, orgId));

      // Trigger Canceled Email to organization admins
      const adminsToCancelNotify = await getAdmins();
      if (adminsToCancelNotify.length > 0) {
        const primaryAdmin = adminsToCancelNotify[0];
        const formattedEndsAt = endsAt ? endsAt.toLocaleDateString() : 'the end of your period';
        void EmailService.subscriptionCanceled({
          recipients: adminsToCancelNotify,
          payload: {
            to: adminsToCancelNotify.map((a) => a.email),
            organizationName: orgName,
            adminName: primaryAdmin.name || 'Admin',
            planName: plan === 'enterprise' ? 'Enterprise' : 'Pro Growth',
            endsAtDate: formattedEndsAt,
            reSubscribeUrl:
              plan === 'enterprise'
                ? process.env.NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE || ''
                : process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO || '',
          },
        });
      }
      break;

    case 'subscription_expired':
    case 'subscription_unpaid':
    case 'subscription_payment_failed':
    case 'subscription_payment_refunded':
      // Downgrade to Starter Free plan
      await db
        .update(organizations)
        .set({
          subscriptionPlan: 'free',
          subscriptionStatus: eventName === 'subscription_expired' ? 'expired' : 'unpaid',
          lemonSubscriptionId: null,
          subscriptionCurrentPeriodEnd: null,
        })
        .where(eq(organizations.id, orgId));
      break;

    default:
      console.log(`[LS Webhook] Unhandled event: ${eventName}`);
  }

  // ── 5. Return 200 immediately ───────────────────────────────────────────────
  return new NextResponse('OK', { status: 200 });
}
