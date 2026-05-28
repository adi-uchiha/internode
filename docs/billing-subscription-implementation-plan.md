# CHUNK 1: Overview, Pricing, DB Schema, Core Business Logic

## 🏛️ 1. Plan Overview

This plan integrates a fully working billing and subscription system into **Internode** using **Lemon Squeezy** as Merchant of Record (MoR). No LLC required — solo developers in India can sign up as Individual/Sole Proprietors using their PAN card and SBI bank account (via Stripe Connect payout flow inside Lemon Squeezy).

The architecture follows Internode's existing patterns exactly:

- All state flows through the **TanStack Query Cache Synergy** engine
- Subscription status is stored in the DB and exposed via the existing `GET /api/organization` route
- Webhooks from Lemon Squeezy update the DB → trigger `CacheManager.organizations.sync()` → UI auto-reflects
- No paywalls. All features 100% unlocked. Plans differ only by **volume limits** (orgs, members, projects)

---

## 🏷️ 2. Revised Pricing Tiers (Final, Approved)

All features (AI Recaps, Advanced Analytics, Leave Management, Admin Comments, API Keys) are **fully unlocked on ALL tiers**. Plans gate only on scale/volume.

| Limit                        | Free (Starter) `$0` | Pro (Growth) `$29/mo` | Enterprise `$99/mo` |
| :--------------------------- | :------------------ | :-------------------- | :------------------ |
| **Active Organizations**     | 1                   | 3                     | Unlimited           |
| **Active Members (Interns)** | 5                   | 20                    | Unlimited           |
| **Active Projects**          | 3                   | Unlimited             | Unlimited           |
| **All Features**             | ✅ 100% Unlocked    | ✅ 100% Unlocked      | ✅ 100% Unlocked    |

### Limit Warning UX Design Principle

- **No blocked pages.** Users navigate freely everywhere.
- **Usage bar** in Settings → Billing shows `[NODE_LIMIT: 3/5 INTERNS]`
- **Graceful interceptor modal** triggers only when an action (invite/create) would exceed the limit

---

## 🗄️ 3. Database Layer Changes

### 3.1 [MODIFY] `db/schema/organizations.ts`

**Current state:** 7 columns (`id`, `name`, `slug`, `logo`, `createdAt`, `updatedAt`, `metadata`, `ticketCounter`)

**Add 5 billing columns:**

```typescript
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: text('metadata'),
  ticketCounter: integer('ticket_counter').notNull().default(0),

  // --- NEW BILLING COLUMNS ---
  subscriptionPlan: text('subscription_plan').notNull().default('free'),
  // Values: 'free' | 'pro' | 'enterprise'

  subscriptionStatus: text('subscription_status').notNull().default('active'),
  // Values: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'expired'

  lemonSubscriptionId: text('lemon_subscription_id'),
  // Lemon Squeezy subscription ID (e.g. "sub_abc123")

  lemonCustomerId: text('lemon_customer_id'),
  // Lemon Squeezy customer ID for billing portal redirect

  subscriptionCurrentPeriodEnd: timestamp('subscription_current_period_end'),
  // When the current billing period ends; used for grace period logic
});
```

**Why these 5 fields?**

- `subscriptionPlan` — the source of truth for limit checks in every API route
- `subscriptionStatus` — separates "has paid" from "payment failed/canceled"
- `lemonSubscriptionId` — needed to match incoming webhooks to orgs
- `lemonCustomerId` — needed to generate a customer billing portal URL
- `subscriptionCurrentPeriodEnd` — used to determine if a canceled subscription is still in grace period

### 3.2 Migration Commands

```bash
# From /code/jin/projects/internode/
bun db:generate   # Generates new SQL migration file (0015_*.sql)
bun db:push       # Applies migration to Neon PostgreSQL production DB
```

> **Note:** `drizzle-kit push` is non-destructive — it only adds columns. No data loss.

---

## ⚙️ 4. Core Business Logic Layer

### 4.1 [NEW] `lib/billing-plans.ts`

Central source of truth for plan limits, Lemon Squeezy variant IDs, and server-side limit checking.

```typescript
import { db } from '@/db';
import { organizations, members, projects } from '@/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { ApiError } from './api-error';

// ── Plan Limits ────────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: { maxMembers: 5, maxProjects: 3, maxOrgs: 1 },
  pro: { maxMembers: 20, maxProjects: 999999, maxOrgs: 3 },
  enterprise: { maxMembers: 999999, maxProjects: 999999, maxOrgs: 999999 },
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

// ── Lemon Squeezy Variant ID → Plan mapping ────────────────────────────────────
// Fill these in after creating products in Lemon Squeezy dashboard
export const LEMON_VARIANT_TO_PLAN: Record<string, PlanId> = {
  [process.env.LEMON_VARIANT_PRO_MONTHLY ?? 'UNSET_PRO']: 'pro',
  [process.env.LEMON_VARIANT_ENTERPRISE_MONTHLY ?? 'UNSET_ENT']: 'enterprise',
};

// ── Limit Checker ──────────────────────────────────────────────────────────────
export async function assertPlanLimit(
  orgId: string,
  limitType: 'members' | 'projects'
): Promise<void> {
  // Fetch org plan
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
    columns: { subscriptionPlan: true },
  });

  const plan = (org?.subscriptionPlan ?? 'free') as PlanId;
  const limits = PLAN_LIMITS[plan];

  if (limitType === 'members') {
    const [result] = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, orgId));
    const current = result?.count ?? 0;
    if (current >= limits.maxMembers) {
      throw new ApiError(
        `Your ${plan} plan allows a maximum of ${limits.maxMembers} active members. ` +
          `Upgrade your plan to invite more interns.`,
        403,
        'plan_limit_exceeded'
      );
    }
  }

  if (limitType === 'projects') {
    const [result] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.organizationId, orgId));
    const current = result?.count ?? 0;
    if (current >= limits.maxProjects) {
      throw new ApiError(
        `Your ${plan} plan allows a maximum of ${limits.maxProjects} active projects. ` +
          `Upgrade to Pro or Enterprise for unlimited projects.`,
        403,
        'plan_limit_exceeded'
      );
    }
  }
}

// ── Usage Stats (for UI) ───────────────────────────────────────────────────────
export async function getOrgUsage(orgId: string, plan: PlanId) {
  const [memberCount] = await db
    .select({ count: count() })
    .from(members)
    .where(eq(members.organizationId, orgId));
  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.organizationId, orgId));

  const limits = PLAN_LIMITS[plan];
  return {
    members: { used: memberCount?.count ?? 0, max: limits.maxMembers },
    projects: { used: projectCount?.count ?? 0, max: limits.maxProjects },
    orgs: { max: limits.maxOrgs },
  };
}
```

### 4.2 [NEW] `lib/env.ts` additions

Add the Lemon Squeezy environment variables:

```typescript
// Lemon Squeezy (Billing)
export const LEMON_SQUEEZY_API_KEY = requireEnv('LEMON_SQUEEZY_API_KEY');
export const LEMON_SQUEEZY_WEBHOOK_SECRET = requireEnv('LEMON_SQUEEZY_WEBHOOK_SECRET');
export const LEMON_SQUEEZY_STORE_ID = requireEnv('LEMON_SQUEEZY_STORE_ID');
```

Also add public env vars for checkout URLs:

```typescript
export const NEXT_PUBLIC_LEMON_CHECKOUT_PRO = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO || '';
export const NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE =
  process.env.NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE || '';
```

### 4.3 [MODIFY] `lib/constants.ts`

Add a `BILLING` constants block:

```typescript
export const BILLING = {
  PLANS: ['free', 'pro', 'enterprise'] as const,
  GRACE_PERIOD_DAYS: 3, // After cancelation, org retains access for 3 days
  CACHE_KEY: ['active-organization-billing'] as const,
} as const;
```

### 4.4 [MODIFY] `turbo.json`

Add new env vars to the `globalEnv` array so they are not stripped during `turbo build`:

```json
"LEMON_SQUEEZY_API_KEY",
"LEMON_SQUEEZY_WEBHOOK_SECRET",
"LEMON_SQUEEZY_STORE_ID",
"NEXT_PUBLIC_LEMON_CHECKOUT_PRO",
"NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE",
"LEMON_VARIANT_PRO_MONTHLY",
"LEMON_VARIANT_ENTERPRISE_MONTHLY"
```

# CHUNK 2: API Routes, Webhook Handler, Cache Synergy Layer

## 5. API Routes — Limit Enforcement

### 5.1 [MODIFY] `app/api/invites/route.ts`

**Change:** Before creating an invitation, call `assertPlanLimit(orgId, 'members')`.

```typescript
// Inside POST handler, after role checks, before authClient.organization.inviteMember():
import { assertPlanLimit } from '@/lib/billing-plans';

// Count existing members + pending invitations to prevent circumvention via invite spam
const pendingInvites = await db.query.invitations.findMany({
  where: and(eq(invitations.organizationId, orgId), eq(invitations.status, 'pending')),
});
// assertPlanLimit counts DB members; we add pending invite count on top
const [memberResult] = await db
  .select({ count: count() })
  .from(members)
  .where(eq(members.organizationId, orgId!));
const totalEffective = (memberResult?.count ?? 0) + pendingInvites.length;
const org = await db.query.organizations.findFirst({
  where: eq(organizations.id, orgId!),
  columns: { subscriptionPlan: true },
});
const plan = (org?.subscriptionPlan ?? 'free') as PlanId;
const limit = PLAN_LIMITS[plan].maxMembers;
if (totalEffective >= limit) {
  throw new ApiError(
    `Member limit reached for ${plan} plan (${limit} max). Upgrade to invite more.`,
    403,
    'plan_limit_exceeded'
  );
}
```

### 5.2 [MODIFY] `app/api/projects/route.ts`

**Change:** Before inserting a new project, call `assertPlanLimit(orgId, 'projects')`.

```typescript
// Inside POST handler:
import { assertPlanLimit } from '@/lib/billing-plans';
await assertPlanLimit(orgId!, 'projects');
// then proceed with db.insert(projects)...
```

### 5.3 [MODIFY] `app/api/organization/route.ts`

**Change:** Expose billing fields in the `GET` response so `useOrganization()` can surface them in the UI without a separate API call.

```typescript
// GET handler — add to existing org query:
const org = await db.query.organizations.findFirst({
  where: eq(organizations.id, orgId!),
  columns: {
    id: true,
    name: true,
    slug: true,
    logo: true,
    metadata: true,
    // NEW billing fields:
    subscriptionPlan: true,
    subscriptionStatus: true,
    lemonCustomerId: true,
    subscriptionCurrentPeriodEnd: true,
  },
});

// Add usage stats to response:
const usage = await getOrgUsage(orgId!, (org?.subscriptionPlan ?? 'free') as PlanId);

return NextResponse.json({
  ...existingFields,
  billing: {
    plan: org?.subscriptionPlan ?? 'free',
    status: org?.subscriptionStatus ?? 'active',
    customerId: org?.lemonCustomerId ?? null,
    currentPeriodEnd: org?.subscriptionCurrentPeriodEnd ?? null,
    usage,
  },
});
```

### 5.4 [NEW] `app/api/billing/portal/route.ts`

**Purpose:** Generate a Lemon Squeezy Customer Portal URL for the active organization's billing admin.

```typescript
export const GET = withErrorHandler(
  async (req, { orgId }) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId!),
      columns: { lemonCustomerId: true, subscriptionPlan: true },
    });

    if (!org?.lemonCustomerId) {
      // Free plan — no portal, redirect to checkout
      return NextResponse.json({ portalUrl: null, isFree: true });
    }

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
    const data = await response.json();
    const portalUrl = data?.data?.attributes?.urls?.customer_portal ?? null;

    return NextResponse.json({ portalUrl, isFree: false });
  },
  { requiredRole: ['admin', 'owner'] }
);
```

---

## 6. Lemon Squeezy Webhook Handler

### 6.1 [NEW] `app/api/webhooks/lemonsqueezy/route.ts`

This is the most security-critical file in the entire billing implementation. It must:

1. Validate the HMAC-SHA256 signature before touching any data
2. Handle `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`
3. Update the org's billing columns in the DB
4. Trigger `CacheManager.organizations.sync()` via invalidation

```typescript
import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { LEMON_SQUEEZY_WEBHOOK_SECRET } from '@/lib/env';
import { LEMON_VARIANT_TO_PLAN } from '@/lib/billing-plans';

// Lemon Squeezy sends the raw body + X-Signature header
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

  // ── 2. Extract org ID from custom_data (passed during checkout) ─────────────
  const orgId: string | undefined = customData?.org_id;
  if (!orgId) {
    // No org_id means we cannot reconcile — log and return 200 to prevent retries
    console.warn('[LS Webhook] Missing org_id in custom_data:', event?.meta);
    return new NextResponse('OK', { status: 200 });
  }

  const lemonSubscriptionId = String(event?.data?.id ?? '');
  const lemonCustomerId = String(attributes?.customer_id ?? '');
  const variantId = String(attributes?.variant_id ?? '');
  const renewsAt = attributes?.renews_at ? new Date(attributes.renews_at) : null;
  const endsAt = attributes?.ends_at ? new Date(attributes.ends_at) : null;

  // ── 3. Map variant → plan tier ───────────────────────────────────────────────
  const plan = LEMON_VARIANT_TO_PLAN[variantId];

  // ── 4. Event Handlers ────────────────────────────────────────────────────────
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
      await db
        .update(organizations)
        .set({
          subscriptionPlan: plan ?? 'pro',
          subscriptionStatus: 'active',
          lemonSubscriptionId,
          lemonCustomerId,
          subscriptionCurrentPeriodEnd: renewsAt,
        })
        .where(eq(organizations.id, orgId));
      break;

    case 'subscription_cancelled':
      // Mark as canceled but keep plan until period end (grace period)
      await db
        .update(organizations)
        .set({
          subscriptionStatus: 'canceled',
          subscriptionCurrentPeriodEnd: endsAt,
        })
        .where(eq(organizations.id, orgId));
      break;

    case 'subscription_expired':
    case 'subscription_unpaid':
      // Downgrade to free after expiry
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
      // Unhandled event — return 200 to prevent Lemon Squeezy retry loops
      console.log(`[LS Webhook] Unhandled event: ${eventName}`);
  }

  // ── 5. Return 200 immediately — Lemon Squeezy retries on non-2xx ─────────────
  return new NextResponse('OK', { status: 200 });
}
```

**Webhook Configuration in Lemon Squeezy Dashboard:**

- URL: `https://your-domain.com/api/webhooks/lemonsqueezy`
- Events to subscribe: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_unpaid`
- Pass `custom_data: { org_id: activeOrgId }` in checkout URL query params

---

## 7. Cache Synergy Engine Updates

### 7.1 [MODIFY] `hooks/useOrganization.ts`

Extend `OrganizationDetails` type and `queryFn` to include billing fields:

```typescript
// Add to OrganizationDetails interface:
export interface BillingInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'expired';
  customerId: string | null;
  currentPeriodEnd: string | null;
  usage: {
    members: { used: number; max: number };
    projects: { used: number; max: number };
    orgs: { max: number };
  };
}

export interface OrganizationDetails {
  id: string;
  organizationName: string;
  organizationSlug: string;
  organizationDomain: string;
  brandingColor?: string;
  logo?: string | null;
  billing: BillingInfo; // NEW
}

// Modify useOrganization() queryFn to call /api/organization instead of
// authClient.organization.getFullOrganization() — because we need billing data
// that better-auth doesn't return:
export function useOrganization() {
  return useQuery({
    queryKey: ['active-organization-details'],
    queryFn: async () => {
      const res = await fetch('/api/organization');
      if (!res.ok) throw new Error('Failed to fetch organization');
      return res.json() as Promise<OrganizationDetails>;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// NEW: convenience hook for billing only (avoids re-rendering non-billing components)
export function useOrgBilling() {
  const { data } = useOrganization();
  return data?.billing ?? null;
}
```

### 7.2 [MODIFY] `lib/cache/domains/organizations.ts`

Add an optimistic plan upgrade function:

```typescript
export const OrganizationDomain = {
  softSwapLogo: (...) => { /* existing */ },
  sync: (...) => { /* existing */ },

  // NEW: Optimistically update billing state in the cache
  // Used for instant UI feedback while webhook processes in background
  optimisticUpdateBilling: (
    queryClient: QueryClient,
    updates: Partial<BillingInfo>
  ) => {
    queryClient.setQueryData(
      ['active-organization-details'],
      (old: OrganizationDetails | undefined) =>
        old ? { ...old, billing: { ...old.billing, ...updates } } : old
    );
  },

  // NEW: Invalidate the organization query after a webhook or plan change
  syncBilling: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['active-organization-details'] });
  },
};
```

### 7.3 [MODIFY] `lib/cache/sync-registry.ts`

Extend `SynergyPayloads` and `SyncRegistry['organizations.updated']` to handle billing changes:

```typescript
// Add to SynergyPayloads:
'organizations.updated': {
  updates: Partial<OrganizationDetails>;
  billingUpdated?: boolean; // NEW flag
};

// Update the handler:
'organizations.updated': [
  (qc, { updates, billingUpdated }) => {
    if (updates.brandingColor) {
      const { setBrandingColor } = useUIStore.getState();
      setBrandingColor(updates.brandingColor);
    }
    if (billingUpdated) {
      // Ripple billing change to all cached organization data
      OrganizationDomain.syncBilling(qc);
    }
  },
],
```

### 7.4 [MODIFY] `lib/cache/manager.ts`

Export the new `BillingDomain` shortcut under `CacheManager`:

```typescript
// No new file needed — just expose the new OrganizationDomain methods:
export const CacheManager = {
  // ...existing domains...
  organizations: OrganizationDomain, // Now includes optimisticUpdateBilling + syncBilling
};
```

### 7.5 [MODIFY] `lib/constants.ts`

Add billing query key to `CACHE_KEYS`:

```typescript
export const CACHE_KEYS = {
  TICKETS: ['tickets'] as const,
  PROJECTS: ['projects'] as const,
  USERS: ['users'] as const,
  ANALYTICS: ['analytics'] as const,
  MEMBERS: ['members'] as const,
  ORGANIZATION: ['active-organization-details'] as const, // NEW
};
```

# CHUNK 3: Frontend UI, Auth Layer, Landing Page, Verification Plan

## 8. Frontend UI Changes — Full List

### 8.1 [MODIFY] `hooks/useOrganization.ts` — `usePlanLimit` hook

New convenience hook consumed by members + projects pages to show usage bars:

```typescript
export function usePlanLimitWarning(type: 'members' | 'projects') {
  const billing = useOrgBilling();
  if (!billing) return { isNearLimit: false, isAtLimit: false, used: 0, max: 0 };
  const stat = billing.usage[type];
  return {
    used: stat.used,
    max: stat.max,
    isAtLimit: stat.used >= stat.max,
    isNearLimit: stat.used >= stat.max * 0.8, // 80% threshold for soft warning
    percentUsed: Math.min(100, (stat.used / stat.max) * 100),
  };
}
```

---

### 8.2 [MODIFY] `app/tasks/settings/page.tsx`

**What changes:** Add a new **"Billing & Subscription"** section card between the General section and the API Keys section. This is the primary billing management UI, gated to admin/owner roles (already enforced by the existing role check at the top of the page).

**Design:** Cyber-minimalist terminal card. Shows plan tier tag, usage bars, and action button.

```
┌─────────────────────────────────────────────────────────────────┐
│  [BILLING_CORE]                           [PLAN: PRO_GROWTH]    │
│  ─────────────────────────────────────────────────────────────  │
│  STATUS: ● ACTIVE          Period ends: Jun 28, 2026            │
│                                                                  │
│  NODE_USAGE ─────────────────────────────────────────────────   │
│  INTERNS    ████████░░  8 / 20 active                           │
│  PROJECTS   ████░░░░░░  4 / ∞                                   │
│  ORGS       ██░░░░░░░░  1 / 3                                   │
│                                                                  │
│  [MANAGE_BILLING_PORTAL →]                                      │
└─────────────────────────────────────────────────────────────────┘
```

For **free plan**, instead shows:

```
┌─────────────────────────────────────────────────────────────────┐
│  [BILLING_CORE]                           [PLAN: STARTER_FREE]  │
│  ─────────────────────────────────────────────────────────────  │
│  INTERNS    ████░░░░░░  2 / 5 active                            │
│  PROJECTS   ██░░░░░░░░  1 / 3 active                            │
│                                                                  │
│  [UPGRADE_TO_PRO_GROWTH →]  [UPGRADE_TO_ENTERPRISE →]          │
└─────────────────────────────────────────────────────────────────┘
```

Upgrade buttons append `?checkout[custom][org_id]=<activeOrgId>` to the Lemon Squeezy checkout URL so the webhook can identify the organization.

---

### 8.3 [MODIFY] `components/auth/OrgSwitcher.tsx`

**What changes:** Add a small plan badge next to the active organization name in the sidebar switcher. The badge reads `[FREE]`, `[PRO]`, or `[ENT]` in green matrix mono font.

```typescript
// Inside the org name rendering in OrgSwitcher:
import { useOrgBilling } from '@/hooks/useOrganization';

const billing = useOrgBilling();
const planLabel = billing?.plan === 'enterprise' ? 'ENT' : billing?.plan === 'pro' ? 'PRO' : 'FREE';
const planColor = billing?.plan === 'free'
  ? 'text-muted-foreground/50 border-muted-foreground/20'
  : 'text-primary border-primary/40';

// Render inline:
<span className={`font-mono text-[8px] uppercase px-1 py-px border ${planColor}`}>
  {planLabel}
</span>
```

---

### 8.4 [MODIFY] `app/tasks/members/page.tsx` — InviteModal limit gate

**What changes:** Before showing the invite form, check if the org is at its member limit. If so, show an upgrade prompt inline inside the invite modal instead of the form.

```typescript
// Inside InviteModal component, add:
import { usePlanLimitWarning } from '@/hooks/useOrganization';
const memberLimit = usePlanLimitWarning('members');

// If at limit, render upgrade notice instead of invite form:
if (memberLimit.isAtLimit) {
  return (
    <div className="p-8 text-center space-y-4 border border-amber-500/20 bg-amber-500/5">
      <p className="font-mono text-[10px] text-amber-400 uppercase tracking-widest">
        [NODE_LIMIT_REACHED]: {memberLimit.used}/{memberLimit.max} ACTIVE_INTERNS
      </p>
      <p className="text-sm text-muted-foreground">
        Your current plan has reached its member limit.
        Upgrade to invite more interns.
      </p>
      <Button variant="hero" onClick={() => router.push('/tasks/settings#billing')}>
        Upgrade Plan →
      </Button>
    </div>
  );
}
```

Also add a usage bar at the top of the Members page header:

```
Team Members    ████████░░ 8/20 active interns (Pro)
```

---

### 8.5 [MODIFY] `app/tasks/projects/page.tsx` — Create project limit gate

**What changes:** Wrap the "Initialize Project" button with a plan limit check.

```typescript
import { usePlanLimitWarning } from '@/hooks/useOrganization';
const projectLimit = usePlanLimitWarning('projects');

// Replace the current button with:
<RequireRole role="admin">
  <Button
    variant="hero"
    onClick={() => {
      if (projectLimit.isAtLimit) {
        toast.error(`Project limit reached (${projectLimit.used}/${projectLimit.max}). Upgrade your plan.`);
        router.push('/tasks/settings#billing');
        return;
      }
      setIsModalOpen(true);
    }}
  >
    <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-2" />
    Initialize Project
    {projectLimit.isNearLimit && (
      <span className="ml-2 font-mono text-[9px] text-amber-400">
        ({projectLimit.used}/{projectLimit.max})
      </span>
    )}
  </Button>
</RequireRole>
```

---

### 8.6 [MODIFY] `components/auth/CreateOrgModal.tsx` — Multi-org limit gate

**What changes:** When the user tries to create a new org (from OrgSwitcher), check their current org count against the plan limit.

```typescript
// In handleSubmit, before authClient.organization.create():
const orgsRes = await authClient.organization.list();
const currentOrgCount = orgsRes.data?.length ?? 0;
// Fetch plan from current active org billing
const billingRes = await fetch('/api/organization');
const billing = await billingRes.json();
const maxOrgs = PLAN_LIMITS[billing.billing.plan as PlanId].maxOrgs;

if (currentOrgCount >= maxOrgs) {
  toast.error(
    `Your plan allows a maximum of ${maxOrgs} organization(s). ` +
      `Upgrade to Pro to manage up to 3 organizations.`
  );
  return;
}
```

---

### 8.7 [MODIFY] `app/tasks/onboarding/page.tsx` — Multi-org limit gate

Same check as above in `handleCreateOrg()`. If a user already has 1 org (free plan) and tries to create another, show a friendly notice and redirect to their existing org's billing settings.

---

### 8.8 [MODIFY] `app/tasks/dashboard/page.tsx` — Billing status alert banner

**What changes:** Add a dismissible cyber-styled alert banner at the very top of the admin dashboard if:

- `billing.status === 'past_due'` → "Payment failed — update billing to avoid service interruption"
- `billing.status === 'canceled'` → "Subscription ends on [date] — renew to keep Pro access"

```typescript
// Inside AdminDashboardContent, above KPI Row:
{billing?.status === 'past_due' && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <Icon icon="solar:danger-triangle-linear" className="w-4 h-4 text-amber-400" />
      <span className="font-mono text-[10px] uppercase text-amber-400 tracking-widest">
        [ALERT]: Payment failed. Update billing to prevent service interruption.
      </span>
    </div>
    <Button size="sm" variant="outline" onClick={() => router.push('/tasks/settings#billing')}>
      Fix Billing →
    </Button>
  </motion.div>
)}
```

---

### 8.9 [MODIFY] `app/tasks/layout.tsx` — OrgScopedLayout sidebar usage

**What changes:** The `OrgScopedLayout` component is the ideal place to fetch billing and store it in cache once per session, so all child components can read it cheaply via `useOrgBilling()`.

```typescript
// Inside OrgScopedLayout, add:
// This call primes the billing cache for the entire session
const { data: orgDetails } = useOrganization(); // already fetches billing via modified hook
```

No extra API call needed — the modified `useOrganization()` already fetches billing from `GET /api/organization`.

---

### 8.10 [MODIFY] `components/landing/PricingSection.tsx`

**What changes:** Replace the static hardcoded plan data with the revised, accurate plan definitions. Update CTA buttons to link to the actual Lemon Squeezy checkout URLs. Add a prominent "100% features unlocked on all plans" callout banner above the pricing cards.

```typescript
const plans = [
  {
    name: 'Starter',
    tagline: 'For small teams & solo founders',
    price: 'Free',
    period: '',
    limits: ['1 organization', 'Up to 5 active interns', 'Up to 3 projects'],
    features: ['All features unlocked', 'Advanced analytics', 'AI weekly recaps', 'API keys & agents', 'Email support'],
    cta: 'Start Free',
    ctaHref: '/login',
    featured: false,
  },
  {
    name: 'Pro Growth',
    tagline: 'For scaling engineering teams',
    price: '$29',
    period: '/month',
    limits: ['Up to 3 organizations', 'Up to 20 active interns', 'Unlimited projects'],
    features: ['Everything in Starter', 'Priority email support', 'Billing portal access'],
    cta: 'Upgrade to Pro',
    ctaHref: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO,
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For large-scale engineering orgs',
    price: '$99',
    period: '/month',
    limits: ['Unlimited organizations', 'Unlimited interns', 'Unlimited projects'],
    features: ['Everything in Pro', 'Dedicated onboarding call', 'SLA guarantees'],
    cta: 'Upgrade to Enterprise',
    ctaHref: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE,
    featured: false,
  },
];

// Add above the cards:
<div className="flex items-center justify-center gap-2 mb-12 px-4 py-3 border border-primary/20 bg-primary/5 max-w-xl mx-auto">
  <Icon icon="solar:shield-check-bold" className="w-4 h-4 text-primary" />
  <span className="font-mono text-xs text-primary uppercase tracking-widest">
    100% of all features unlocked on every plan — no paywalls, ever.
  </span>
</div>
```

---

### 8.11 [MODIFY] `lib/seo-constants.ts`

Add subscription-related keywords:

```typescript
'subscription-based project management',
'affordable Jira alternative',
'free engineering HUD',
```

---

## 9. Auth Layer — AuthContext & RBAC

### 9.1 [NO CHANGE] `contexts/AuthContext.tsx`

No changes needed. `activeOrgId`, `orgRole`, and `isOrgReady` are sufficient. Billing state is managed by `useOrganization()` separately, following the separation-of-concerns pattern already established.

### 9.2 [MODIFY] `lib/rbac.ts`

Add a billing-specific permission:

```typescript
export const PERMISSIONS = {
  // ...existing...
  CAN_MANAGE_BILLING: ['owner'] as const, // Only owners can change subscription
  CAN_VIEW_BILLING: ['admin', 'owner'] as const,
};
```

### 9.3 [NO CHANGE] `lib/api-handler.ts`

No structural changes. The existing `withErrorHandler` with `requiredRole` option is sufficient for protecting the new `/api/billing/portal` route.

---

## 10. Email Templates

### 10.1 [NEW] `emails/SubscriptionUpgradedEmail.tsx`

A React Email template sent when an organization successfully upgrades:

- Subject: `[Internode] You're now on the Pro Growth plan 🚀`
- Content: Plan name, member/project limits unlocked, billing portal URL

### 10.2 [NEW] `emails/SubscriptionCanceledEmail.tsx`

A React Email template sent when a subscription is cancelled:

- Subject: `[Internode] Your Pro plan ends on [date]`
- Content: Grace period notice, re-subscribe CTA, downgrade warning

### 10.3 [MODIFY] `lib/email/service.ts`

Add `subscriptionUpgraded()` and `subscriptionCanceled()` methods, called from the webhook handler after DB update.

---

## 11. Environment Variables (.env additions)

```bash
# Lemon Squeezy — Server Only
LEMON_SQUEEZY_API_KEY=lmsqzy_...
LEMON_SQUEEZY_WEBHOOK_SECRET=wh_...
LEMON_SQUEEZY_STORE_ID=12345

# Lemon Squeezy Variant IDs (from your product dashboard)
LEMON_VARIANT_PRO_MONTHLY=67890
LEMON_VARIANT_ENTERPRISE_MONTHLY=11111

# Lemon Squeezy Checkout URLs — Public (embedded in checkout buttons)
NEXT_PUBLIC_LEMON_CHECKOUT_PRO=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID_PRO
NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE=https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID_ENT
```

---

## 12. Verification Plan

### 12.1 DB Migration

```bash
bun db:generate  # generates 0015_billing_columns.sql
bun db:push      # applies to Neon DB — verify columns in Drizzle Studio
bun db:studio    # open at localhost:4983 — confirm 5 new columns in organizations table
```

### 12.2 Webhook Signature Test (curl)

```bash
# With wrong signature — must return 401:
curl -X POST https://your-domain.com/api/webhooks/lemonsqueezy \
  -H "X-Signature: bad_signature" \
  -H "Content-Type: application/json" \
  -d '{"meta":{"event_name":"subscription_created"}}'

# With correct HMAC-SHA256 signature — must return 200 and update DB
```

### 12.3 Limit Enforcement Test

1. Set org `subscriptionPlan = 'free'` in DB
2. Already have 5 members — try to send a 6th invite
3. Backend returns `403 plan_limit_exceeded`
4. Frontend shows toast with upgrade CTA

### 12.4 Cache Synergy Test

1. Manually update `subscriptionPlan = 'pro'` in DB for an org
2. Call `GET /api/organization` — confirm `billing.plan === 'pro'` in response
3. `useOrgBilling()` hook auto-reflects new plan in OrgSwitcher badge
4. Usage bars update in Settings → Billing card

### 12.5 Landing Page Pricing Section

1. Verify new plan data renders correctly
2. Verify "100% features unlocked" banner appears
3. CTA buttons link to correct Lemon Squeezy checkout URLs

---

## 🇮🇳 Appendix: Indian Solo Developer Payout Setup

**You need:** PAN card + SBI bank account + IFSC code. That's it.

1. Sign up at [Lemon Squeezy](https://www.lemonsqueezy.com) → **Individual/Sole Proprietor**
2. In Payouts → choose **Stripe Connect** → complete onboarding wizard:
   - Business type: Individual
   - Tax ID: PAN card number
   - Bank: SBI account number + IFSC
3. Lemon Squeezy → Stripe Convert → NEFT/IMPS → SBI account in INR automatically
4. No LLC, no international card, no Payoneer needed
