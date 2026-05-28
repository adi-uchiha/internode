# ⚡ Internode System Architecture Manual — SUPER CONTEXT

This document is the definitive **Super Context** for the Internode SaaS project. Any engineer or AI agent working on this codebase must read and strictly adhere to the patterns, rules, and architectural decisions outlined here. This is not optional documentation — it captures uncommon, non-obvious, and critical knowledge that cannot be inferred by reading individual files in isolation.

---

## 🏛️ 1. Core Ideology & Tech Stack

Internode is a **real-time, engineering-grade project management platform** — a developer-first, Jira alternative. It is built for engineering teams managing interns and projects with time tracking, analytics, and AI-powered weekly recaps.

### Stack

| Layer              | Technology                                                  |
| :----------------- | :---------------------------------------------------------- |
| **Framework**      | Next.js 15 (App Router)                                     |
| **Runtime**        | Bun (package manager + script runner)                       |
| **Database**       | Neon PostgreSQL (serverless)                                |
| **ORM**            | Drizzle ORM                                                 |
| **Authentication** | better-auth (with organization plugin)                      |
| **State / Cache**  | TanStack Query (React Query v5)                             |
| **UI Components**  | shadcn/ui + Tailwind CSS                                    |
| **Icons**          | Iconify + Phosphor (via `@iconify/react`)                   |
| **Animations**     | Framer Motion                                               |
| **Email**          | Resend + React Email                                        |
| **Media Uploads**  | Cloudinary                                                  |
| **Billing**        | Lemon Squeezy (Merchant of Record — pending implementation) |
| **Linting**        | ESLint                                                      |
| **CI**             | Husky + GitHub Actions                                      |

### Key Commands

```bash
bun dev           # Start dev server
bun build         # Production build
bun db:generate   # Generate Drizzle migration SQL
bun db:push       # Apply migrations to Neon DB
bun db:studio     # Open Drizzle Studio at localhost:4983
bun lint          # Run ESLint
```

---

## 🔑 2. Authentication Architecture (better-auth)

### Critical: Do NOT use `useActiveMember()` from better-auth

The `useActiveMember()` hook from better-auth is **banned** in this codebase. It fires unconditionally on every render and hits `GET /api/auth/organization/get-active-member` even when no organization is active — causing a cascade of `400 Bad Request` errors in the console on every page load.

**The correct pattern:** Use TanStack Query with `enabled: !!activeOrgId` guard:

```typescript
// ✅ CORRECT: guarded, promise-based, no leaks
const { data: memberData } = useQuery({
  queryKey: ['active-member', activeOrgId],
  queryFn: async () => {
    const { data, error } = await authClient.organization.getActiveMember();
    if (error) throw new Error(error.message);
    return data;
  },
  enabled: !!activeOrgId, // THE CRITICAL GUARD
});

// ❌ WRONG: unconditional, causes 400 spam
const { data: member } = useActiveMember();
```

This pattern is documented in `contexts/AuthContext.tsx` (line 87–101).

### The `isOrgReady` Gate

`isOrgReady` is the **single source of truth** for whether the app is ready to render org-scoped UI. It is `true` only when ALL of these are true:

1. Session has loaded (not pending)
2. Organizations list has been fetched
3. EITHER: `activeOrgId` is set AND member record is resolved
   OR: user has no organizations (show onboarding)

**Never render org-dependent components without checking `isOrgReady`.** This is enforced architecturally via the `OrgScopedLayout` pattern in `app/tasks/layout.tsx`.

### OrgScopedLayout Pattern

All hooks that depend on an active organization (`useUserInvitations`, `useSearchHistory`, notifications, etc.) are **NOT** called anywhere in AuthContext. They are co-located in `OrgScopedLayout` inside `app/tasks/layout.tsx`, which only mounts when `isOrgReady === true`.

This is the correct way to conditionally fire hooks at the architectural level — **not via `enabled` flags scattered across components**, but via conditional rendering of the component that owns those hooks.

```typescript
// app/tasks/layout.tsx — only rendered when isOrgReady is true
function OrgScopedLayout({ children }) {
  // SAFE to call org-scoped hooks here
  const { data: searchHistory } = useSearchHistory({ enabled: true });
  const { data: userInvites } = useUserInvitations();
  // ...
}
```

### Organization Switch — `safeSwitchOrganization()`

Switching organizations is NOT a simple setActive call. It requires:

1. `authClient.organization.setActive({ organizationId })`
2. `authClient.getSession()` — refresh the session store
3. `queryClient.clear()` — **full cache wipe** to prevent cross-tenant data leakage
4. `router.refresh()` — force server-side revalidation

This is encapsulated in `lib/auth-utils.ts → safeSwitchOrganization()`. **Always use this function** when switching orgs. Never call `setActive` directly.

### Auth Plugin — Organization Schema Mapping

In `lib/auth.ts`, the `drizzleAdapter` maps better-auth's internal entity names to Drizzle schema tables. The mapping is:

```typescript
schema: {
  user: schema.users,
  session: schema.sessions,
  account: schema.accounts,
  verification: schema.verifications,
  organization: schema.organizations,
  member: schema.members,
  invitation: schema.invitations,
}
```

If you add tables that better-auth needs to know about, they must be registered here.

### Welcome Email on Signup

A `databaseHooks.user.create.after` hook in `lib/auth.ts` fires a **fire-and-forget** welcome email after every new user registration via `EmailService.welcome()`. Errors are caught and logged but never block the signup flow.

---

## 🗄️ 3. Database Schema Architecture (Drizzle ORM)

### Schema Files (all in `db/schema/`)

| File               | Tables                                  |
| :----------------- | :-------------------------------------- |
| `auth.ts`          | `sessions`, `accounts`, `verifications` |
| `users.ts`         | `users`                                 |
| `organizations.ts` | `organizations`                         |
| `members.ts`       | `members`                               |
| `invitations.ts`   | `invitations`                           |
| `projects.ts`      | `projects`                              |
| `tickets.ts`       | `tickets`, `timeLogs`, `comments`       |
| `breakthroughs.ts` | `breakthroughs`                         |
| `goals.ts`         | `goals`                                 |
| `labels.ts`        | `labels`                                |
| `leaves.ts`        | `leaves`                                |
| `system.ts`        | `activities`, `notifications`           |
| `search.ts`        | `searchHistory`                         |
| `relations.ts`     | All Drizzle `relations()` definitions   |
| `index.ts`         | Re-exports all tables                   |

### Critical: `organizations.ts` Upcoming Billing Columns

As part of the subscription system implementation (see Section 11), 5 new columns will be added to the `organizations` table:

- `subscriptionPlan` — `'free' | 'pro' | 'enterprise'` (default: `'free'`)
- `subscriptionStatus` — `'active' | 'canceled' | 'past_due' | 'unpaid' | 'expired'` (default: `'active'`)
- `lemonSubscriptionId` — Lemon Squeezy subscription ID
- `lemonCustomerId` — Lemon Squeezy customer ID for billing portal
- `subscriptionCurrentPeriodEnd` — `timestamp`, billing period end date

### The `ticketCounter` Column

`organizations.ticketCounter` is an integer that auto-increments and is used to generate human-readable ticket IDs (e.g., `INT-42`). This is incremented atomically on ticket creation using a DB-level update, NOT by counting existing tickets. Never rely on `COUNT(tickets)` for ticket ID generation.

### Drizzle Migration Workflow

```bash
# 1. Modify schema file
# 2. Generate migration SQL (saves to db/migrations/)
bun db:generate

# 3. Review generated SQL in db/migrations/ directory
# 4. Apply locally to Development DB
bun db:push

# 5. Verify locally in Drizzle Studio
bun db:studio
```

**Never manually edit migration files.** Let Drizzle generate them.

### 🛡️ Development vs. Production Database Separation & Deployment Safety

To protect our live application, the Development and Production database environments are strictly isolated:

- **Development DB**: The local `.env` file's `DATABASE_URL` points to the Development Neon instance. You can safely experiment, reset, and push schema changes here.
- **Production DB**: Vercel contains its own production Neon DB connection string injected dynamically via its Build and Deployment environment variable settings.

#### How Production Schema Migrations Run (0% Downtime, Zero Data Loss)

Instead of manual updates or unsafe pushes directly against production, migrations are automated in our CI/CD pipeline:

1. **Migration Files are Committed**: All generated schema migration scripts in `./db/migrations` (such as `0015_little_sentinels.sql` containing the Lemon Squeezy billing columns) are fully committed to version control.
2. **Vercel Hook Execution**: Vercel is configured with the Build Command:
   ```bash
   bun run db:migrate && bun run build
   ```
3. **Sequential Execution**: When you push your code, Vercel initiates the build pipeline. Before compiling the Next.js static bundles, Drizzle's migration engine connects securely to the Production Neon instance and applies all pending SQL migrations sequentially.
4. **Safety Guarantee**: This guarantees that the production database schema is up-to-date and completely synchronized **before** the new application code goes live, preventing runtime column crashes with zero manual steps!

---

## ⚙️ 4. Cache Synergy Engine (The Most Complex System)

The Cache Synergy Engine is the most architecturally unique part of Internode. It is a structured, event-driven, optimistic state management layer built on top of TanStack Query.

### Architecture Overview

```
Mutation completes
      │
      ▼
CacheManager.dispatch('event.name', payload)
      │
      ▼
SyncRegistry looks up registered Transformers
      │
      ▼
Each Transformer runs pure domain operations
 ├─ AnalyticsDomain.adjustTicketCounts()
 ├─ ActivityDomain.optimisticCreate()
 ├─ NotificationDomain.add()
 └─ SearchDomain.removeEntity()
      │
      ▼
QueryClient cache updated instantly (no refetch)
      │
      ▼
React re-renders with new data (0ms latency)
```

### Key Files

| File                         | Purpose                                                     |
| :--------------------------- | :---------------------------------------------------------- |
| `lib/cache/core.ts`          | `CacheCore` — low-level generic list/item update utilities  |
| `lib/cache/augmenter.ts`     | `CacheAugmenter` — helpers for analytics trend calculations |
| `lib/cache/manager.ts`       | `CacheManager` — single entry point, aggregates all domains |
| `lib/cache/sync-registry.ts` | `SyncRegistry` — maps event names to transformer arrays     |
| `lib/cache/impact-map.ts`    | Defines which events impact which domains                   |
| `lib/cache/domains/*.ts`     | Domain-specific optimistic update logic                     |

### How to Add a New Synergy Event

1. Add the event payload type to `SynergyPayloads` in `sync-registry.ts`
2. Add transformer(s) to `SyncRegistry[eventName]`
3. Call `CacheManager.dispatch('event.name', payload)` in the mutation's `onSuccess`

### CacheCore Utilities (Uncommon Patterns)

`CacheCore.updateInLists()` is filter-aware — it automatically handles multiple query key variants (e.g., `['tickets', { status: 'in-progress' }]` and `['tickets', { assigneeId: 'xyz' }]`) by querying all cached keys matching the base `['tickets']` key and applying the filter predicate to determine if the updated item still belongs in each filtered list.

### Cross-Tab Synchronization

The `QueryProvider` in `providers/query-provider.tsx` uses `broadcastQueryClient` from `@tanstack/query-broadcast-client-experimental` with channel `'internode-cache-sync'`. This syncs cache invalidations across multiple browser tabs automatically.

```typescript
// providers/query-provider.tsx
broadcastQueryClient({
  queryClient,
  broadcastChannel: 'internode-cache-sync',
});
```

### Global Error Toasting

The `QueryProvider` catches errors from both `QueryCache` and `MutationCache` and automatically shows Sonner toasts for `ApiClientError` instances. This means API route errors surfaced as `ApiClientError` are automatically toasted — you do NOT need to add `.catch(toast.error)` in every mutation.

---

## 🔌 5. API Route Architecture

### `withErrorHandler` — The Route Wrapper (Critical Pattern)

Every API route in Internode wraps its handler with `withErrorHandler` from `lib/api-handler.ts`. This wrapper provides:

1. **Dual auth modes** — Bearer token (API keys for MCP/CI) and session cookies (browser)
2. **Auto org-scoping** — Extracts `orgId` from the session and verifies the user is a member
3. **Role enforcement** — `requiredRole` option checks against `ROLE_RANK` hierarchy
4. **Rate limiting** — 100 requests/min per IP (in-memory sliding window)
5. **Structured error responses** — `ApiError` → JSON `{ error, code, details }`
6. **Dev-only stack traces** — Full error message in dev, generic 500 in production

```typescript
export const POST = withErrorHandler(
  async (req, { orgId, orgRole, member }) => {
    // handler — orgId, orgRole, member are guaranteed non-null
    return NextResponse.json({ success: true });
  },
  { requiredRole: ['admin', 'owner'] } // optional
);
```

### API Key Authentication (Dual Auth)

The `withErrorHandler` checks `Authorization: Bearer <token>` first. If present, it:

1. SHA-256 hashes the raw token and looks it up in the `apiKeys` table
2. Extracts `userId` and `organizationId` from the stored API key
3. Synthesizes a fake `Session` object matching the expected shape
4. Tracks `lastUsedAt` on the key

This allows external tools (MCP servers, CI/CD, n8n) to call any API using a pre-generated API key without a browser session.

### `withCronAuth` — Cron Job Wrapper

Cron jobs (overdue scanner, weekly digest) use `withCronAuth` instead. It validates `Authorization: Bearer <CRON_SECRET>` from the environment. No org/user context. Used only in `app/api/cron/`.

### `ApiClientError` vs `ApiError`

- **Server-side:** `lib/api-error.ts → ApiError` — thrown inside handlers, caught by `withErrorHandler`
- **Client-side:** `lib/api-client.ts → ApiClientError` — thrown by `apiClient` when response is not OK

Both share the same JSON shape `{ error, code, details }` — `ApiClientError` is automatically toasted by `QueryProvider`.

---

## 🛡️ 6. RBAC (Role-Based Access Control)

### Role Hierarchy

```
owner (rank 3) > admin (rank 2) > member (rank 1)
```

The `isAtLeast(role, minRole)` function in `lib/rbac.ts` uses this hierarchy for `withErrorHandler`'s `requiredRole` option. Specifying `requiredRole: 'admin'` grants access to both `admin` AND `owner` (since owner ≥ admin).

### PERMISSIONS Map

```typescript
export const PERMISSIONS = {
  CAN_DELETE_TICKET:      ['admin', 'owner'],
  CAN_CREATE_TICKET:      ['admin', 'owner', 'member'],
  CAN_EDIT_OTHERS_TICKET: ['admin', 'owner'],
  CAN_CREATE_PROJECT:     ['admin', 'owner'],
  CAN_DELETE_PROJECT:     ['owner'],             // ONLY owner can delete
  CAN_INVITE_MEMBER:      ['admin', 'owner'],
  CAN_MANAGE_ROLES:       ['owner'],             // ONLY owner
  CAN_VIEW_ANALYTICS:     ['admin', 'owner'],
  ...
};
```

Use `hasPermission(orgRole, 'CAN_DELETE_PROJECT')` on the client for conditional UI rendering.
Use `withErrorHandler(handler, { requiredRole: 'owner' })` on the server for route protection.

**Never gate UI without also gating the API route.** Defense in depth.

---

## 📧 7. Email Architecture (Resend + React Email)

### Critical Design Rules

1. **NEVER throw from EmailService.** The `dispatch()` internal function catches all SMTP errors and logs them. Email failures must NEVER block the primary user action.
2. **Always call EmailService with `void`** at call sites (fire-and-forget):
   ```typescript
   void EmailService.ticketAssigned({ ... }).catch(console.error);
   ```
3. **Dual-action methods** — Most `EmailService` methods create an in-app notification (via `NotificationService`) AND send an email, from a single call site.
4. **Preference-gated emails** — Almost all emails check `isEmailEnabled(userId, 'preferenceKey')` before dispatching. Only `sendInvitation` and `welcome` are NOT preference-gated (always transactional).

### Email Methods (Current)

| Method                  | Trigger              | Preference Gate       |
| :---------------------- | :------------------- | :-------------------- |
| `sendInvitation()`      | Admin invites member | ❌ Always sent        |
| `welcome()`             | New user signup      | ❌ Always sent        |
| `ticketAssigned()`      | Ticket assigned      | `ticketAssigned`      |
| `ticketStatusChanged()` | Status updated       | `ticketStatusChanged` |
| `newComment()`          | Comment added        | `newComment`          |
| `overdueTicket()`       | Daily cron           | `overdueReminder`     |
| `leaveSubmitted()`      | Leave request        | `leaveSubmitted`      |
| `leaveStatusChanged()`  | Approve/reject       | `leaveStatus`         |
| `memberJoined()`        | Invite accepted      | `memberJoined`        |
| `feedbackProvided()`    | Admin feedback       | `feedbackProvided`    |
| `weeklyDigest()`        | Sunday cron          | `weeklyDigest`        |
| `timeLogged()`          | Time logged          | `timeLogged`          |

### Upcoming: Billing Emails

Two new emails will be added as part of the billing implementation:

- `subscriptionUpgraded()` — when plan changes to Pro/Enterprise
- `subscriptionCanceled()` — when subscription is canceled

Both will be preference-gated and fire-and-forget from the webhook handler.

---

## 📊 8. Analytics & Dashboard Architecture

### Analytics Data Source

Analytics data is NOT computed live from tickets. It is stored in pre-aggregated format via optimistic cache updates from the Cache Synergy Engine. The `AnalyticsDomain` in `lib/cache/domains/analytics.ts` handles:

- `adjustTicketCounts()` — increments/decrements total, in-progress, done counts
- `adjustStatusFlow()` — updates the status distribution chart data
- `adjustLoggedHours()` — updates total hours logged
- `adjustLeaderboard()` — updates member leaderboard scores

This means the analytics page shows **instant updates** when tickets are created/updated — without any refetch.

### Dashboard Page Architecture

`app/tasks/dashboard/page.tsx` is a 800+ line file with two main sections:

1. **KPI Row** — ticket counts, hours, active members (pulled from `useAnalytics()` hook)
2. **Leaderboard** — member productivity ranking
3. **Activity Feed** — live activity stream from `useActivities()`
4. **Status Flow Chart** — Recharts donut chart from analytics domain

The dashboard is admin/owner-gated at the route level. Members land on a different view.

---

## 🔔 9. Notification System

### In-App Notifications

The `NotificationService` class in `lib/notifications.ts` creates DB rows in the `notifications` table. The bell icon in the sidebar shows unread count via `useNotifications()` hook.

### Deduplication Note

The `NotificationService.create()` method has a comment noting "basic deduplication" but it currently **does not deduplicate**. If the same event fires multiple times, multiple notifications will be created. Be aware of this in webhook handlers or cron jobs — add manual deduplication guards.

### Critical: Don't Call NotificationService Directly in Routes

Most routes should call `EmailService.ticketAssigned()` etc. instead of `NotificationService.create()` directly. EmailService methods create both the in-app notification AND the email from one call. Calling `NotificationService.create()` directly skips the email layer.

**Exception:** The `app/api/events/member-joined` route handles in-app notification separately (before calling `EmailService.memberJoined`) because the timing of invite acceptance is complex.

---

## 🎨 10. Design System & UI Conventions

### Fonts

- **Display font (headings):** `font-display` — maps to the brand font (loaded via `next/font`)
- **Mono font (labels, badges, code):** `font-mono` — used extensively for the "terminal/engineering" aesthetic
- **Labels:** Always `font-mono text-[10px] uppercase tracking-widest text-muted-foreground`

### Color Variables

The app uses CSS custom properties via shadcn/ui's convention:

- `hsl(var(--primary))` — the green accent color (overridable per org via `brandingColor`)
- `hsl(var(--muted-foreground))` — subtle text
- `hsl(var(--border))` — standard borders
- `hsl(var(--card))` — card backgrounds

### Org Branding

The `brandingColor` field in the organization settings overrides `--primary` globally. This is applied in `useUIStore` when org details load, enabling per-org color themes.

### Button Variants

The `Button` component has a custom `variant="hero"` (solid primary) and `variant="hero-outline"` (outlined primary). Use these for primary actions, not the standard `default` shadcn variant.

### Icon Rule

**NEVER** use non-suffixed Phosphor icons (e.g., `GraduationCap`, `Briefcase`).
**ALWAYS** use the suffixed versions (`GraduationCapIcon`, `BriefcaseIcon`) directly from `@phosphor-icons/react`.

Most icons in the codebase use Iconify (`@iconify/react`), specifically the `solar:` and `ph:` icon sets. Use Iconify unless specifically using Phosphor.

```typescript
// ✅ Correct - Iconify
<Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary" />

// ✅ Correct - Phosphor (suffixed)
import { CheckCircleIcon } from '@phosphor-icons/react';

// ❌ Wrong - Phosphor (unsuffixed, deprecated)
import { CheckCircle } from '@phosphor-icons/react';
```

### Toast System

Use `import { toast } from '@/lib/toast'` (the project's own wrapper), NOT `import { toast } from 'sonner'` directly. The project wrapper may have custom configuration.

---

## 💳 11. Billing & Subscription System (Fully Operational)

> [!IMPORTANT]
> The Lemon Squeezy billing system is **fully implemented and operational** in the codebase. Active volume plan tracking, limit gating, settings card, organization badges, real-time alert banners, transactional emails, and customer portal integrations are fully completed. See `docs/billing-subscription-implementation-plan.md` for the original design architecture.

### Architecture Decision: Lemon Squeezy as Merchant of Record

Lemon Squeezy is used instead of Stripe because it acts as the **Merchant of Record (MoR)** — it handles all tax/VAT compliance globally and pays out to Indian bank accounts (SBI) via Stripe Connect (managed internally by LS). This is critical for solo Indian developers who do not have an LLC or LLP.

**Payout setup:** Sign up as Individual/Sole Proprietor with PAN card + SBI bank account + IFSC. No LLC needed.

### Pricing Philosophy: "100% Unlocked, Volume-Gated"

**All features** (AI Recaps, Analytics, API Keys, MCP, Admin Comments, etc.) are **fully available on ALL plans**. Plans differ ONLY by volume caps:

| Limit           | Free (Starter) | Pro (Growth) `$29/mo` | Enterprise `$99/mo` |
| :-------------- | :------------: | :-------------------: | :-----------------: |
| Organizations   |       1        |           3           |      Unlimited      |
| Active Members  |       5        |          20           |      Unlimited      |
| Active Projects |       3        |       Unlimited       |      Unlimited      |

### Database Fields (to be added to `organizations` table)

```typescript
subscriptionPlan: text().notNull().default('free'),
// 'free' | 'pro' | 'enterprise'

subscriptionStatus: text().notNull().default('active'),
// 'active' | 'canceled' | 'past_due' | 'unpaid' | 'expired'

lemonSubscriptionId: text(),
// e.g. "sub_abc123" — used to match webhook events to orgs

lemonCustomerId: text(),
// used to generate billing portal redirect URL

subscriptionCurrentPeriodEnd: timestamp(),
// billing period end date — used for grace period logic
```

### Core Files (to be created)

- **`lib/billing-plans.ts`** — `PLAN_LIMITS`, `LEMON_VARIANT_TO_PLAN`, `assertPlanLimit()`
- **`app/api/webhooks/lemonsqueezy/route.ts`** — HMAC-SHA256 signature verification + subscription lifecycle handler
- **`app/api/billing/portal/route.ts`** — Lemon Squeezy customer portal URL generator

### Webhook Security Pattern (Critical)

The Lemon Squeezy webhook handler **MUST** validate the `X-Signature` HMAC-SHA256 header before processing any payload. The signature is computed using `LEMON_SQUEEZY_WEBHOOK_SECRET`:

```typescript
const expectedSig = createHmac('sha256', LEMON_SQUEEZY_WEBHOOK_SECRET)
  .update(rawBody) // rawBody = await req.text() — must be raw, not parsed JSON
  .digest('hex');

if (expectedSig !== req.headers.get('x-signature')) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

**Always return 200** at the end of the webhook handler. Lemon Squeezy retries on any non-2xx response, causing duplicate DB updates.

### Checkout URL Custom Data (Org ID passing)

Pass `custom_data: { org_id: activeOrgId }` in the Lemon Squeezy checkout URL so the webhook can identify which organization to update:

```
https://your-store.lemonsqueezy.com/checkout/buy/VARIANT_ID?checkout[custom][org_id]=ORG_ID
```

### Cache Synergy Integration for Billing

After the webhook updates the DB:

1. The next `GET /api/organization` call returns updated billing data
2. `useOrganization()` cache is invalidated via `CacheManager.organizations.syncBilling(queryClient)`
3. All components reading `useOrgBilling()` automatically re-render

### Environment Variables (to be added to `.env` AND `turbo.json`)

```bash
LEMON_SQUEEZY_API_KEY=lmsqzy_...
LEMON_SQUEEZY_WEBHOOK_SECRET=wh_...
LEMON_SQUEEZY_STORE_ID=12345
LEMON_VARIANT_PRO_MONTHLY=67890
LEMON_VARIANT_ENTERPRISE_MONTHLY=11111
NEXT_PUBLIC_LEMON_CHECKOUT_PRO=https://...
NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE=https://...
```

> [!WARNING]
> **turbo.json gotcha:** All new environment variables MUST be added to `globalEnv` in `turbo.json`, otherwise they are stripped during the Turborepo build pipeline and the app crashes in production with "Missing required environment variable".

### UX Design Rules for Billing

1. **No paywalls on pages.** Users navigate freely everywhere.
2. **No feature locking.** Every feature is 100% accessible on all plans.
3. **Graceful interceptor modals** — triggered only when an action would EXCEED the plan limit (e.g., inviting a 6th intern on Free plan). The modal explains the limit and links to Settings → Billing.
4. **Usage bars** in Settings → Billing show current usage vs. limit (`3/5 INTERNS`).
5. **Billing alert banner** in the Dashboard — only visible to admins/owners — for `past_due` or `canceled` status.
6. **Plan badge** in OrgSwitcher sidebar: `[FREE]`, `[PRO]`, `[ENT]`.

---

## 🚨 12. Known Gotchas & Non-Obvious Patterns

### The `NEXT_PUBLIC_` + turbo.json Problem

If you add a new environment variable, you MUST add it to BOTH:

1. `.env` (and Vercel dashboard env vars)
2. `turbo.json → globalEnv` array

If missing from `turbo.json`, the var is treated as undefined in the built output even if it's set in `.env`. This causes `requireEnv()` to throw at server startup.

### The Rate Limiter is In-Memory

`lib/rate-limit.ts` uses a `Map<string, ...>` for rate limiting. In a serverless/multi-instance environment (Vercel), each cold-start gets a fresh Map. The rate limiter only works correctly within a single warm Lambda instance. For production-grade rate limiting, replace with Upstash Redis.

### Drizzle Schema File Must Re-export Everything

`db/schema/index.ts` re-exports all tables. If you add a new schema file, import and re-export its tables from `index.ts`. The `drizzleAdapter` in `lib/auth.ts` uses the full `schema` import — missing tables here will cause auth to fail.

### The `brandingColor` Is Applied via `useUIStore`, Not CSS Directly

The org's `brandingColor` is applied to `--primary` CSS variable via `useUIStore.setBrandingColor()`. This happens inside `DashboardLayout` when org details load. If you see stale colors after switching orgs, ensure `queryClient.clear()` is called (via `safeSwitchOrganization`), which clears the org details cache and triggers a fresh fetch + color application.

### The `ticketShortId` vs `ticketId`

There are TWO ID systems for tickets:

- `ticket.id` — the full UUID (e.g. `clx9ab...`) — used for DB queries and API routes
- `ticket.ticketId` — the short human-readable ID (e.g. `INT-42`) — derived from `organization.ticketCounter`

In email subjects and UI labels, ALWAYS use `ticketShortId` (the `INT-42` format). In API calls and links, use the full `ticket.id` UUID.

### Never Call `authClient.organization.getFullOrganization()` for Billing

The `getFullOrganization()` from better-auth does NOT return the custom billing columns we add to the organizations table. After adding billing columns, you must call `GET /api/organization` (our custom route) to get the full org data including billing. The `useOrganization()` hook in `hooks/useOrganization.ts` will be updated to use `apiClient.get('/api/organization')` for this reason.

### The `OrgSwitcher.tsx` Double Fetch Problem (Historical Bug)

The `OrgSwitcher` previously called `authClient.organization.list()` on every render, causing two org-list fetches. It was refactored to use TanStack Query with `queryKey: ['list-organizations']` so the result is cached and shared between the switcher and any other components reading the org list.

### `members.joined` Synergy Event — In-App Notification Handled Separately

Unlike most Email+Notification pairs (where `EmailService` handles both), the `members.joined` event has the in-app notification created in `app/api/events/member-joined/route.ts` and the email in `EmailService.memberJoined()`. This split exists because the join event is fired server-side by better-auth before our code runs, requiring the events route to be the hook point.

---

## 🏗️ 13. Cron Jobs

### Available Crons (`app/api/cron/`)

| Cron Route                | Schedule             | Purpose                                                        |
| :------------------------ | :------------------- | :------------------------------------------------------------- |
| `/api/cron/overdue`       | Daily (midnight UTC) | Finds tickets past due date → sends overdue email to assignees |
| `/api/cron/weekly-digest` | Sunday 18:00 UTC     | Sends weekly summary email to all org members                  |

### Adding a New Cron Job

1. Create `app/api/cron/<name>/route.ts`
2. Use `withCronAuth` wrapper
3. Register the schedule in `vercel.json`:
   ```json
   {
     "crons": [
       { "path": "/api/cron/overdue", "schedule": "0 0 * * *" },
       { "path": "/api/cron/weekly-digest", "schedule": "0 18 * * 0" }
     ]
   }
   ```
4. All crons are protected by `Authorization: Bearer CRON_SECRET`

---

## 🌐 14. Deployment & Hosting

### Platform: Vercel

- **Framework preset:** Next.js (App Router)
- **Node.js version:** 20.x
- **Package manager:** Bun

### Environment Variable Checklist (All Required)

```bash
# Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Internode

# DB
DATABASE_URL=postgresql://...neon.tech/...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Email (SMTP via Resend/Nodemailer)
SMTP_USER=resend
SMTP_PASSWORD=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Media
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ORG=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_CONTENT=...

# Cron Security
CRON_SECRET=...

# MCP
NEXT_PUBLIC_MCP_URL=https://your-domain.com/mcp

# Billing (UPCOMING)
LEMON_SQUEEZY_API_KEY=...
LEMON_SQUEEZY_WEBHOOK_SECRET=...
LEMON_SQUEEZY_STORE_ID=...
LEMON_VARIANT_PRO_MONTHLY=...
LEMON_VARIANT_ENTERPRISE_MONTHLY=...
NEXT_PUBLIC_LEMON_CHECKOUT_PRO=...
NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE=...
```

### `turbo.json` `globalEnv` — MUST Stay in Sync

The `turbo.json` file has a `globalEnv` array listing all environment variables used across the monorepo. When adding a new env var, **always add it here** or it will be stripped during `turbo build`.

---

## 🧪 15. Testing & Verification Patterns

### Testing API Routes Locally

```bash
# Test webhook signature validation
curl -X POST http://localhost:3000/api/webhooks/lemonsqueezy \
  -H "X-Signature: invalid" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 401 Unauthorized

# Test plan limit enforcement
# 1. Set org subscriptionPlan = 'free' in DB (via Drizzle Studio)
# 2. Ensure 5 members already exist
# 3. Try to invite a 6th
# Expected: 403 plan_limit_exceeded
```

### Cache Synergy Verification Pattern

To verify a synergy event is working correctly:

1. Open DevTools → Network tab, filter by `api/`
2. Perform the mutation (e.g., change ticket status)
3. Confirm: **no new API calls** fire to analytics or dashboard endpoints
4. Confirm: analytics KPI cards update immediately (optimistic)
5. After `staleTime` expires (60s by default), verify the server data matches

### Drizzle Studio Usage

```bash
bun db:studio
# Opens at http://localhost:4983
# Use to inspect raw DB state, verify migration columns, debug query results
```

---

## 📁 16. Key File Reference Map

| File / Directory                                   | What It Does                                                           |
| :------------------------------------------------- | :--------------------------------------------------------------------- |
| `contexts/AuthContext.tsx`                         | Global session + org state. The `isOrgReady` gate lives here.          |
| `lib/auth.ts`                                      | better-auth server config — organization plugin, OAuth, schema mapping |
| `lib/auth-utils.ts`                                | `safeSwitchOrganization()` — the ONLY correct way to switch orgs       |
| `lib/api-handler.ts`                               | `withErrorHandler` + `withCronAuth` — wraps all API routes             |
| `lib/api-client.ts`                                | `apiClient` — typed fetch wrapper used in all hooks                    |
| `lib/billing-plans.ts`                             | _(upcoming)_ Plan limits + `assertPlanLimit()`                         |
| `lib/rbac.ts`                                      | `PERMISSIONS` map + `hasPermission()` + `isAtLeast()`                  |
| `lib/notifications.ts`                             | `NotificationService` — in-app notification creation                   |
| `lib/email/service.ts`                             | `EmailService` — all transactional emails (fire-and-forget)            |
| `lib/cache/manager.ts`                             | `CacheManager` — single entry point for all cache operations           |
| `lib/cache/core.ts`                                | `CacheCore` — low-level generics (updateInLists, prependToLists, etc.) |
| `lib/cache/sync-registry.ts`                       | `SyncRegistry` — event → transformer mapping                           |
| `lib/cache/augmenter.ts`                           | `CacheAugmenter` — hydrates models with relational data from cache     |
| `lib/cache/domains/`                               | Per-domain optimistic update functions                                 |
| `lib/feature-flags.ts`                             | `AUTH_FLAGS` and `featureConfig` — feature toggle layer                |
| `lib/store/ui-store.ts`                            | Zustand store — branding color, UI toggles                             |
| `lib/env.ts`                                       | Typed env var access — throws at startup if missing                    |
| `lib/rate-limit.ts`                                | In-memory sliding window rate limiter (100 req/min per IP)             |
| `db/schema/`                                       | All Drizzle ORM table definitions                                      |
| `providers/query-provider.tsx`                     | TanStack Query setup + cross-tab sync + global error toasting          |
| `app/tasks/layout.tsx`                             | `OrgScopedLayout` — the org-gate for all dashboard hooks               |
| `app/api/webhooks/lemonsqueezy/`                   | _(upcoming)_ Lemon Squeezy billing webhook handler                     |
| `docs/billing-subscription-implementation-plan.md` | Complete billing implementation plan                                   |
| `docs/cache-synergy-blueprint.md`                  | Deep-dive on Cache Synergy architecture                                |
| `docs/email-notifications-plan.md`                 | Email architecture decisions                                           |

---

## ✅ 17. Developer Checklist — Before Submitting a PR

- [ ] Did you add new API routes? Wrap with `withErrorHandler` or `withCronAuth`
- [ ] Did you add new DB columns? Run `bun db:generate` and `bun db:push`
- [ ] Did you add new env vars? Add to both `.env` AND `turbo.json → globalEnv`
- [ ] Did you add a new org switch pathway? Used `safeSwitchOrganization()` (not raw `setActive`)
- [ ] Did you call `EmailService` methods? Called with `void` (fire-and-forget) at call sites
- [ ] Did you add limit checks? Called `assertPlanLimit()` before resource creation
- [ ] Did you add Phosphor icons? Used the suffixed versions (`XxxIcon`) from `@phosphor-icons/react`
- [ ] Did you add a Cache Synergy event? Registered in both `SynergyPayloads` and `SyncRegistry`
- [ ] Did you add a new email template? Registered in `EmailService` + `lib/email/types.ts`
