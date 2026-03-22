# 🔍 Internode — Full Project Audit

> **Scope**: Backend APIs, Frontend Hooks/Context, DB Schema, Email Service, Cron Jobs, MCP Server.  
> **Severity levels**: 🔴 Bug / Security Risk · 🟠 Bad Practice / Reliability Issue · 🟡 Code Quality / Maintainability

---

## 1. Backend — [lib/api-handler.ts](file:///home/aditya/proj/internode/lib/api-handler.ts)

### 🔴 Race condition in ticket counter (tickets route)

**File**: [app/api/tickets/route.ts](file:///home/aditya/proj/internode/app/api/tickets/route.ts) L62–68  
The `ticketCounter` increment is done in one statement and the insert is in a separate statement. Under concurrent requests, two callers could read the same counter value _if_ a bug appears in the DB transaction model. However the real bug here is there is **no transaction** wrapping the counter update + ticket insert — if the insert fails after the counter is already incremented, the sequence number is permanently skipped. This should be wrapped in a `db.transaction()`.

```ts
// BUG: Two separate DB operations with no transaction
const [updatedOrg] = await db.update(organizations)...;  // counter incremented
const [newTicketRaw] = await db.insert(tickets).values(...); // insert — if this throws, counter is wasted
```

### 🔴 `userId` can be null past the guard in [api-handler.ts](file:///home/aditya/proj/internode/lib/api-handler.ts)

**File**: [lib/api-handler.ts](file:///home/aditya/proj/internode/lib/api-handler.ts) L118  
`userId` is declared as `string | null` and is only guaranteed non-null inside the `if (!options.skipAuth)` block. On the line [eq(members.userId, userId)](file:///home/aditya/proj/internode/lib/api-client.ts#28-72) (L118), `userId` is passed to drizzle **without a null check**. TypeScript should catch this but the `as unknown` casts used throughout suppress it. If `userId` were `null` here it would produce a malformed SQL query.

### 🟠 Dynamic `import()` on every request in [api-handler.ts](file:///home/aditya/proj/internode/lib/api-handler.ts)

**File**: [lib/api-handler.ts](file:///home/aditya/proj/internode/lib/api-handler.ts) L37–44, L113–115, L125  
`drizzle-orm`, `@/db`, `@/db/schema`, and `./rbac` are dynamically imported on **every single request**. These are never going to change at runtime — they should be static top-level imports. Dynamic imports add module-resolution overhead on every API call and make the code harder to follow.

### 🟠 `void` on `db.update` inside auth handler (fire-and-forget in critical path)

**File**: [lib/api-handler.ts](file:///home/aditya/proj/internode/lib/api-handler.ts) L57–61  
The comment says "fire-and-forget but awaited for safety" — yet `void` is used, meaning it is NOT awaited. If this update fails, nobody will know. At minimum use `void` with `.catch(err => console.error(...))` attached.

### 🟡 `as unknown as Session` cast hides type safety

**File**: [lib/api-handler.ts](file:///home/aditya/proj/internode/lib/api-handler.ts) L93  
The synthesized session for API-key auth is force-cast through `as unknown as Session`. This is a red flag — a properly typed builder function for the synthetic session should be created instead.

---

## 2. Backend — [lib/auth.ts](file:///home/aditya/proj/internode/lib/auth.ts)

### 🔴 `process.env` accessed directly, bypassing [env.ts](file:///home/aditya/proj/internode/lib/env.ts)

**File**: [lib/auth.ts](file:///home/aditya/proj/internode/lib/auth.ts) L85–86

```ts
clientId: process.env.GITHUB_CLIENT_ID as string,
clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
```

`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are available from [lib/env.ts](file:///home/aditya/proj/internode/lib/env.ts) with proper validation ([requireEnv](file:///home/aditya/proj/internode/lib/env.ts#10-25)), but here they are read directly from `process.env` with an `as string` cast — meaning if the env var is missing, `undefined` is silently cast to `string` and auth will fail at runtime with an opaque error instead of a clear startup crash. Already imported vars from [env.ts](file:///home/aditya/proj/internode/lib/env.ts) should be used.

### 🟠 Fire-and-forget welcome email with no error handling

**File**: [lib/auth.ts](file:///home/aditya/proj/internode/lib/auth.ts) L28  
`void EmailService.welcome(...)` — the `void` is fine for fire-and-forget, but there is zero `.catch()` attached. If rendering or SMTP fails it is entirely silent at the call site. (`EmailService.dispatch` internally catches errors, so this is acceptable, but the [dispatch](file:///home/aditya/proj/internode/lib/email/service.ts#47-89) function logs to `console.error` only — no alerting or retry.)

---

## 3. Backend — [lib/env.ts](file:///home/aditya/proj/internode/lib/env.ts)

### 🟠 [requireEnv](file:///home/aditya/proj/internode/lib/env.ts#10-25) silently returns empty string on the client

**File**: [lib/env.ts](file:///home/aditya/proj/internode/lib/env.ts) L11–14

```ts
if (typeof window !== 'undefined') {
  return process.env[key] || '';
}
```

If a **server-only** env var is accidentally imported into a client component, it silently returns `''` instead of throwing. This means bugs like accidentally leaking server env var references into client bundles fail _silently_ rather than loudly. The function should throw or log a warning when called client-side with a private variable.

### 🟡 `NEXT_PUBLIC_MCP_URL` has no server-side validation

**File**: [lib/env.ts](file:///home/aditya/proj/internode/lib/env.ts) L32  
All other `NEXT_PUBLIC_*` vars have server-side validation (L43–50), but `NEXT_PUBLIC_MCP_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, and the Cloudinary upload presets do not — they silently default to `''` and will cause cryptic runtime failures.

---

## 4. Backend — Cron Routes

### 🔴 `sent`/`skipped` counters are racily updated inside concurrent promises

**File**: [app/api/cron/overdue/route.ts](file:///home/aditya/proj/internode/app/api/cron/overdue/route.ts) L39–63  
`sent++` and `skipped++` are mutated inside async arrow functions passed to `.map()`, which all run concurrently via `Promise.allSettled`. In JavaScript `++` is not atomic across microtask boundaries and these are not synchronized — meaning the final counts can be incorrect (though in practice Node.js's single-threaded event loop makes this rare, it's still conceptually wrong and fragile).

### 🟠 Weekly digest fires N×3 separate SQL queries per member

**File**: [app/api/cron/weekly-digest/route.ts](file:///home/aditya/proj/internode/app/api/cron/weekly-digest/route.ts) L52–103  
For each member, 4 separate DB queries are fired (completed tickets, in-progress tickets, hours sum, weekly goals). With 100 members that's 400 queries per cron run. This should be aggregated with a single query per user or batched with `Promise.all` at minimum (currently they're sequential inside the same async function, because the `await` calls are not parallelized).

### 🟠 `lt(tickets.updatedAt, weekEnd)` is wrong for "completed this week"

**File**: [app/api/cron/weekly-digest/route.ts](file:///home/aditya/proj/internode/app/api/cron/weekly-digest/route.ts) L62  
Using `updatedAt < weekEnd` means tickets updated on Sunday itself might not be counted — `weekEnd` from `date-fns/endOfWeek` is set to the _end_ of Sunday (23:59:59), but `lt` is **strictly less than**, not `lte`. Should use `lte` or `lt(weekEnd + 1 day)`.

### 🔴 No deduplication / idempotency for overdue emails

**File**: [app/api/cron/overdue/route.ts](file:///home/aditya/proj/internode/app/api/cron/overdue/route.ts)  
Every time the cron runs, **every** overdue ticket gets an email — there is no check for "was this ticket's overdue email already sent today?" If the cron fires twice (e.g., GitHub Actions retry on timeout), users get duplicate emails. A `lastOverdueSentAt` timestamp on `tickets` or a separate sent-log table is needed.

---

## 5. Database Schema

### 🔴 `members.role` is a plain [text()](file:///home/aditya/proj/internode/lib/api-handler.ts#10-17) with no DB-level enum constraint

**File**: [db/schema/members.ts](file:///home/aditya/proj/internode/db/schema/members.ts) L13

```ts
role: text('role').notNull().default('member'), // ENUM: owner, admin, member
```

Unlike `members.status` and other fields, `role` is a raw [text](file:///home/aditya/proj/internode/lib/api-handler.ts#10-17) with no `{ enum: [...] }` constraint. The comment documents the valid values but nothing enforces them at the DB level. A wrong role can be inserted silently. Should use [text('role', { enum: ['owner', 'admin', 'member'] })](file:///home/aditya/proj/internode/lib/api-handler.ts#10-17).

### 🟠 `tickets.updatedAt` is never actually updated on mutation

**File**: [db/schema/tickets.ts](file:///home/aditya/proj/internode/db/schema/tickets.ts) L32 and [app/api/tickets/[id]/route.ts](file:///home/aditya/proj/internode/app/api/tickets/%5Bid%5D/route.ts)  
`updatedAt` defaults to `defaultNow()` at insert time but Drizzle ORM does not automatically update it on `UPDATE` operations (unlike Prisma's `@updatedAt`). Every `PATCH /api/tickets/:id` must explicitly set `updatedAt: new Date()`, which the weekly digest cron relies on for "completed this week" logic. If any update path omits this field, the digest will show stale data.

### 🟠 `projectIds` stored as `jsonb` instead of a junction table

**File**: [db/schema/tickets.ts](file:///home/aditya/proj/internode/db/schema/tickets.ts) L22  
Ticket-to-project relationships are stored as a JSON array (`jsonb`). This makes querying (filtering tickets by project) rely on the JSONB `@>` operator (L17 in [tickets/route.ts](file:///home/aditya/proj/internode/app/api/tickets/route.ts)) rather than a proper join, which is non-standard, harder to index efficiently, and prevents referential integrity — a deleted `projectId` in the JSON array becomes an orphaned reference with no FK constraint to detect it. A proper `ticket_projects` junction table should be used.

### 🟡 `timeLogs.adminComment` is a loose text field on the log model

**File**: [db/schema/tickets.ts](file:///home/aditya/proj/internode/db/schema/tickets.ts) L50  
Admin comments on time logs are stored as a nullable field directly on `timeLogs`. This means there can only ever be one admin comment per log entry. If the feature ever needs comment history or multiple annotators, this won't scale. A separate feedback/annotation table would be better.

---

## 6. Frontend — [contexts/AuthContext.tsx](file:///home/aditya/proj/internode/contexts/AuthContext.tsx)

### 🟠 `orgRole` defaults to `'member'` when member data is pending

**File**: [contexts/AuthContext.tsx](file:///home/aditya/proj/internode/contexts/AuthContext.tsx) L103

```ts
const orgRole: OrgRole = (memberData?.role as OrgRole) ?? 'member';
```

While `isMemberPending` is true (before the member query resolves), `orgRole` is `'member'`. If any UI component renders before the query settles, it will show a "member" view to a user who might actually be an `owner`. Since `isOrgReady` gates most things, this is partially mitigated — but any component that reads `orgRole` without also checking `isOrgReady` will show incorrect permission states during the loading window.

### 🟠 `login` and `signup` swallow the actual error reason

**File**: [contexts/AuthContext.tsx](file:///home/aditya/proj/internode/contexts/AuthContext.tsx) L184, L210  
Both `login` and `signup` return `false` on failure without propagating the error message. The calling UI (login page) has no way to show the user a specific reason (e.g., "Invalid credentials", "Email already in use"). The `signInError` / `signUpError` should be returned or rethrown.

### 🟡 `useListOrganizations` fires even for unauthenticated users

**File**: [contexts/AuthContext.tsx](file:///home/aditya/proj/internode/contexts/AuthContext.tsx) L81  
`authClient.useListOrganizations()` is called unconditionally — even when `user` is `null`. The hook itself may handle this gracefully internally (by returning empty), but it still fires a network request unnecessarily on every public page load when no session exists. The call should be gated on `!!user`.

---

## 7. Frontend — Hooks

### 🔴 Duplicate `use-mobile` files

**Files**: [hooks/use-mobile.ts](file:///home/aditya/proj/internode/hooks/use-mobile.ts) AND [hooks/use-mobile.tsx](file:///home/aditya/proj/internode/hooks/use-mobile.tsx)  
Both files have identical content (576 bytes). One of them is dead code and will cause confusion about which to import. Should be removed.

### 🟠 [useTickets](file:///home/aditya/proj/internode/hooks/useTickets.ts#27-35) does a full list-fetch on every mount, no pagination

**File**: [hooks/useTickets.ts](file:///home/aditya/proj/internode/hooks/useTickets.ts) L27–34  
[useTickets()](file:///home/aditya/proj/internode/hooks/useTickets.ts#27-35) fetches **all** tickets in the organization on every mount, with no pagination. For orgs with hundreds of tickets, this is a large payload. The `GET /api/tickets` endpoint also fetches all tickets with full relations. This will become a performance bottleneck quickly.

### 🟠 [useInvites.ts](file:///home/aditya/proj/internode/hooks/useInvites.ts) has two **duplicate** section header comments

**File**: [hooks/useInvites.ts](file:///home/aditya/proj/internode/hooks/useInvites.ts) L121–122

```ts
// ─── Invitations ─────────────────────────────────────────────────────────────
// ─── Invitations ─────────────────────────────────────────────────────────────
```

Duplicate section header — minor but indicative of copy-paste residue.

### 🟡 [useTickets](file:///home/aditya/proj/internode/hooks/useTickets.ts#27-35) passes `params` with `undefined` values to `URLSearchParams`

**File**: [hooks/useTickets.ts](file:///home/aditya/proj/internode/hooks/useTickets.ts) L28

```ts
const query = new URLSearchParams(params as Record<string, string>).toString();
```

If `params` is `{ projectId: undefined }`, `URLSearchParams` will serialize it as `projectId=undefined` — a string literal "undefined" — which the server then receives as a filter value. Values should be filtered before being passed: `Object.fromEntries(Object.entries(params ?? {}).filter(([,v]) => v != null))`.

---

## 8. Frontend — [lib/api-client.ts](file:///home/aditya/proj/internode/lib/api-client.ts)

### 🟠 Error toasts fire directly inside `apiClient.request` — impossible to suppress per-mutation

**File**: [lib/api-client.ts](file:///home/aditya/proj/internode/lib/api-client.ts) L47–51  
`showToast: true` is the default. React Query mutations use [onError](file:///home/aditya/proj/internode/hooks/useTickets.ts#200-203) to handle errors — but the toast is being shown _inside the fetch utility_, before [onError](file:///home/aditya/proj/internode/hooks/useTickets.ts#200-203) is even called. This means there is no clean way to handle an error silently in a specific mutation without passing `showToast: false` everywhere. The toast should belong in the React Query [onError](file:///home/aditya/proj/internode/hooks/useTickets.ts#200-203) handler, not the fetch client.

### 🟡 `apiClient.delete` has no generic default

**File**: [lib/api-client.ts](file:///home/aditya/proj/internode/lib/api-client.ts) L101  
`delete<T>` — delete endpoints typically return `void` or a simple confirmation. Callers need to explicitly pass `<void>` or they get `unknown`. The default should be `<T = void>`.

---

## 9. MCP Server — [mcp/server.ts](file:///home/aditya/proj/internode/mcp/server.ts)

### 🔴 In-memory `activeSessions` Map is not process-safe

**File**: [mcp/server.ts](file:///home/aditya/proj/internode/mcp/server.ts) L23–26  
Sessions are stored in a plain in-memory `Map`. On Render/Railway, if the process restarts (e.g., deploy, crash), **all active MCP sessions are lost** and connected AI clients will get 404s on their session IDs and need to reconnect. More critically, if Render is ever scaled to >1 instance, sessions are not shared between instances. This is documented as a known limitation but should at minimum have a health-check warning.

### 🟠 `req: any` in [mcpAuthMiddleware](file:///home/aditya/proj/internode/mcp/server.ts#51-87)

**File**: [mcp/server.ts](file:///home/aditya/proj/internode/mcp/server.ts) L53

```ts
async function mcpAuthMiddleware(req: any, res: Response, next: NextFunction);
```

The `any` type defeats the purpose of TypeScript. The `Request` object should be extended with a proper interface for `mcpProxyIdentity`:

```ts
interface McpRequest extends Request { mcpProxyIdentity?: {...} }
```

### 🟠 CORS allows all origins (`*`)

**File**: [mcp/server.ts](file:///home/aditya/proj/internode/mcp/server.ts) L15–19  
`cors()` is called with only `exposedHeaders` — no `origin` restriction. This means any website can make cross-origin requests to the MCP server. Since it's API-key protected this is lower risk, but best practice is to restrict `origin` to known frontends.

### 🟡 Port fallback is `8080` not validated

**File**: [mcp/server.ts](file:///home/aditya/proj/internode/mcp/server.ts) L136

```ts
const PORT = process.env.PORT || 8080;
```

No validation that `process.env.PORT` is a valid number. `app.listen` will throw an opaque error if it's an invalid string. Should parse and validate.

---

## 10. Email Service — [lib/email/service.ts](file:///home/aditya/proj/internode/lib/email/service.ts)

### 🔴 [ticketAssigned](file:///home/aditya/proj/internode/lib/email/service.ts#144-177) passes `ticketShortId` but the method expects a full `ticketId` (UUID)

**File**: [lib/email/service.ts](file:///home/aditya/proj/internode/lib/email/service.ts) L159

```ts
ticketId: params.payload.ticketShortId,  // e.g. "TASK42"
```

`NotificationService.notifyAssignment` receives this as `ticketId` and passes it to `db.query.tickets.findFirst({ where: eq(tickets.id, ticketId) })`. The `tickets.id` field is a nanoid UUID, not the human-readable `ticketId` (`TASK42`). This query will **always return null** and the notification will silently not be created for ticket assignment events.

### 🟠 Email rendering is sequential (not batched) for multi-recipient methods

**File**: [lib/email/service.ts](file:///home/aditya/proj/internode/lib/email/service.ts) L214–228, L262–272  
For [ticketStatusChanged](file:///home/aditya/proj/internode/lib/email/service.ts#178-230) and [newComment](file:///home/aditya/proj/internode/lib/email/service.ts#231-274), the email render + dispatch happen in a `for` loop sequentially. Each `render()` + SMTP call blocks the next one. These should use `Promise.all` for concurrent dispatch.

### 🟡 [leaveSubmitted](file:///home/aditya/proj/internode/lib/email/service.ts#298-339) — in-app notification loop runs even when `adminRecipients` is empty, then returns early

**File**: [lib/email/service.ts](file:///home/aditya/proj/internode/lib/email/service.ts) L310–320  
The `for` loop over `adminRecipients` runs first, then `if (adminRecipients.length === 0) return` checks on L320. The guard is **after** the loop — so if `adminRecipients.length === 0`, the loop body never executes anyway, but the order is misleading. The early-return guard should come first.

---

## 11. General / Cross-Cutting

### 🔴 No rate limiting on any API route

There is no rate limiting middleware on any `/api/*` route. A malicious actor can spam ticket creation, time logging, or comment posting without restriction. At minimum, auth endpoints and mutation routes need rate limiting (e.g., via `upstash/ratelimit` or a middleware wrapper).

### 🔴 No input sanitization for rich text / ticket descriptions

`tickets.description` is stored raw. If any part of the UI renders this as HTML (e.g., in email templates or a future WYSIWYG), it's an XSS vector. Descriptions should be sanitized on input or at render time.

### 🟠 No database indexes documented or verified

None of the Drizzle schema files define explicit indexes (`.index()`). Queries like [eq(tickets.organizationId, orgId)](file:///home/aditya/proj/internode/lib/api-client.ts#28-72), [eq(members.userId, userId)](file:///home/aditya/proj/internode/lib/api-client.ts#28-72), [eq(notifications.userId, userId)](file:///home/aditya/proj/internode/lib/api-client.ts#28-72) are run constantly with no explicit indexes on these foreign key columns (PostgreSQL does NOT auto-index FKs). This will degrade significantly at scale.

### 🟠 `nanoid()` used as primary key everywhere — no collision detection

All tables use `nanoid()` as a string PK generated in application code. While the collision probability is extremely low, there is no conflict handling on insert — a nanoid collision would result in a 500 error with a raw DB constraint message exposed to the client.

### 🟡 `console.log` / `console.error` used as the only observability mechanism

No structured logging library (like `pino`) or error monitoring (Sentry) is integrated. In production, diagnosing issues requires manually grepping raw logs.

### 🟡 `data` directory appears empty / unused

`/data` directory exists but is empty. Should be removed if unused or documented if intentional.

### 🟡 `models` directory appears empty / unused

`/models` directory exists but appears to contain no files. Dead directory.

---

## Summary Table

| #   | Severity        | Area          | Issue                                                                                       |
| --- | --------------- | ------------- | ------------------------------------------------------------------------------------------- |
| 1   | 🔴 Bug          | Tickets API   | No transaction wrapping counter increment + insert                                          |
| 2   | 🔴 Bug          | Email Service | `ticketAssigned` sends `ticketShortId` where UUID is expected → notifications never created |
| 3   | 🔴 Bug          | Cron          | No idempotency for overdue emails → duplicate emails on retry                               |
| 4   | 🔴 Security     | API           | No rate limiting on any route                                                               |
| 5   | 🔴 Security     | API           | `userId` is `null` past guard — DB query uses unguarded null                                |
| 6   | 🔴 Schema       | DB            | `members.role` has no enum constraint — arbitrary roles can be inserted                     |
| 7   | 🟠 Reliability  | API Handler   | Dynamic `import()` on every request (should be static)                                      |
| 8   | 🟠 Reliability  | Auth          | `process.env` direct access bypasses validated `env.ts` in `auth.ts`                        |
| 9   | 🟠 Reliability  | Cron          | Weekly digest fires N×4 sequential queries per member — should be concurrent/batched        |
| 10  | 🟠 Reliability  | Cron          | `lt(weekEnd)` instead of `lte` may miss Sunday completions                                  |
| 11  | 🟠 Reliability  | Email         | Multi-recipient email dispatch is sequential, not concurrent                                |
| 12  | 🟠 Schema       | DB            | `tickets.updatedAt` not auto-updated by Drizzle — must be set manually everywhere           |
| 13  | 🟠 Schema       | DB            | `projectIds` as JSONB breaks referential integrity; should be a junction table              |
| 14  | 🟠 Frontend     | AuthContext   | `login`/`signup` swallow error messages; UI can't show specific failure reasons             |
| 15  | 🟠 Frontend     | Hooks         | `useListOrganizations` fires even for unauthenticated users                                 |
| 16  | 🟠 Frontend     | Hooks         | `useTickets` sends `undefined` as query param string literals                               |
| 17  | 🟠 Frontend     | Hooks         | No pagination — full ticket list fetched on every mount                                     |
| 18  | 🟠 Frontend     | Api Client    | Toast fires inside `apiClient`, not in React Query `onError` — hard to suppress             |
| 19  | 🔴 Files        | Hooks         | Duplicate `use-mobile.ts` and `use-mobile.tsx` files                                        |
| 20  | 🟠 MCP          | Security      | CORS unrestricted (no `origin` whitelist)                                                   |
| 21  | 🟠 MCP          | Reliability   | In-memory session Map lost on process restart / multi-instance                              |
| 22  | 🟠 DB           | Performance   | No explicit DB indexes on high-frequency FK columns                                         |
| 23  | 🟡 Code Quality | env.ts        | `requireEnv` silently returns `''` on client — should warn                                  |
| 24  | 🟡 Code Quality | env.ts        | Cloudinary / MCP URL vars have no server-side validation                                    |
| 25  | 🟡 Code Quality | General       | No structured logging or error monitoring (Sentry)                                          |
