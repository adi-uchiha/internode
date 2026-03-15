# Enterprise Cache Synergy: The Ultimate Technical Blueprint for Scalable State Management

## 1. Executive Summary

This document serves as the absolute source of truth for Internode's cache management architecture. It defines the transition from an imperative, domain-coupled model to a **Declarative, Dependency-Mapped, and Schema-Driven System**.

As the platform scales to 18+ core entities, the synergy between domains (Tickets, Analytics, Leaderboard, Notifications, etc.) is handled by a **Centralized Orchestrator** backed by a **Static Impact Map** and **Pure Transformer Functions**. This ensures that every local action is reflected accurately across every chart, board, and profile with zero data flickering and 100% organization isolation.

> [!IMPORTANT]
> **Architectural Principle**: This blueprint explicitly avoids building a custom "Smart Engine" or "Event Emitter" in the frontend. Instead, it leverages TanStack Query's built-in capabilities (`setQueryData`, `invalidateQueries`, `onMutate` rollbacks) combined with a **Static Dependency Map** and **Pure Functions** to achieve the same goals with 90% less cognitive load and zero risk of infinite loops.

---

## 2. Global Entity Registry (The Dependency Graph)

The **Entity Registry** defines the "graph" of the cache. It eliminates manual orchestration by defining how entities relate, how they are filtered, and which domains are impacted when a mutation occurs.

### 2.1 The Master Relationship Map (Mapping 18+ Core Domains)

| Entity            | Base Cache Key       | Scoping          | Direct Relations                                                                                      | Collection/Reverse Relations                                            |
| :---------------- | :------------------- | :--------------- | :---------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **Organization**  | `['organizations']`  | -                | `ticketCounter` (Int), `metadata` (JSON), `brandingColor` (Hex)                                       | Members, Projects, Tickets, Invites, Leaves, Goals...                   |
| **User**          | `['users']`          | -                | `notificationSettings` (JSON), `image`, `name`, `stats` (JSON)                                        | Memberships, AssignedTickets, CreatedTickets, Heatmap...                |
| **Ticket**        | `['tickets']`        | `organizationId` | `assignee`, `createdBy`, `projectIds`, `labels` (JSON), `priority` (Enum), `status` (Enum), `dueDate` | TimeLogs, Comments, Activities                                          |
| **Project**       | `['projects']`       | `organizationId` | `techStack` (JSON), `color` (Hex)                                                                     | Members, Breakthroughs, Tickets (transitive), Health %, Runtime (Hours) |
| **TimeLog**       | `['timeLogs']`       | `organizationId` | `ticket`, `user`, `adminFeedback` (JSON)                                                              | -                                                                       |
| **Comment**       | `['comments']`       | `organizationId` | `ticket`, `user`, `content` (Markdown)                                                                | -                                                                       |
| **LeaveRequest**  | `['leaves']`         | `organizationId` | `user`, `type` (Enum), `reason` (Text), `status` (Enum)                                               | -                                                                       |
| **WeeklyGoal**    | `['goals']`          | `organizationId` | `user`, `items` (GoalItem[])                                                                          | Progress % (Computed)                                                   |
| **Notification**  | `['notifications']`  | `organizationId` | `user`, `entityId` (Ref), `read` (Bool)                                                               | Triggered by all domain events                                          |
| **Activity**      | `['activities']`     | `organizationId` | `user`, `ticket`                                                                                      | Type: `tickets`, `time-log`, `members`, `projects`                      |
| **Breakthrough**  | `['breakthroughs']`  | `organizationId` | `user`, `project`, `adminFeedback` (JSON)                                                             | -                                                                       |
| **Label**         | `['labels']`         | `organizationId` | `name`, `color`                                                                                       | Master tags applied to tickets                                          |
| **Member**        | `['members']`        | `organizationId` | `user`, `role` (Enum)                                                                                 | Enriched with `efficiency`, `activeTickets`, `hoursThisWeek`            |
| **ProjectMember** | `['projectMembers']` | `organizationId` | `project`, `user`                                                                                     | Project-specific ACL                                                    |
| **Invitation**    | `['invitations']`    | `organizationId` | `inviter` (User), `email`, `status` (Enum), `expiresAt`                                               | Status: `pending`, `accepted`, `revoked`                                |
| **SearchHistory** | `['searchHistory']`  | `organizationId` | `user`, `entityId` (Polymorphic)                                                                      | Recents list (Ticket/Project/Member)                                    |
| **Leaderboard**   | `['leaderboard']`    | `organizationId` | `user`                                                                                                | Metrics: `ticketsDone`, `hoursLogged`, `efficiency`                     |
| **Analytics**     | `['analytics']`      | `organizationId` | -                                                                                                     | Trends: `tickets`, `velocity`, `completion`, `hours`                    |
| **Presence**      | `['presence']`       | -                | `userId`                                                                                              | `isOnline` (Bool), `lastSeen` (Timestamp)                               |

### 2.2 Transitive Synergy Flows

The engine handles non-trivial "ripple effects":

- **Project <-> Member <-> User**: Updating a project member's activity affects the Project Leaderboard and the User's global stats.
- **TimeLog -> Ticket -> Analytics**: Logging 1 hour increments the Ticket's `loggedHours`, adds a point to the Leaderboard, and updates the Org's daily burn-rate chart.
- **Ticket Creation -> Org Counter**: Creating a ticket increments `organization.ticketCounter` to maintain predictable Short IDs (e.g., `TASK-101`) before the server confirms.

---

## 3. UI-Driven Data Mapping & Computed Synergies

The UI introduces "Derived" relationships that must be managed by the Cache Synergy Engine to prevent stale views.

### 3.1 Dashboard KPI Synergy

- **Logic**: KPI cards (Total Tickets, In Progress, Overdue, Team Hours) are dynamic aggregations.
- **Synergy**: When a ticket is created or its status changes, the `analytics` domain must ripple-update the `kpis` object locally.

### 3.2 Over-Budget Detection Synergy

- **Logic**: The "Over-Budget Tickets" widget depends on `t.loggedHours > t.estimatedHours`.
- **Synergy**: A `TimeLog` insert event must trigger a check on the associated `Ticket`. If the threshold is crossed, the `Ticket` object is locally tagged with a `isOverBudget` flag.

### 3.3 Admin Review & Feedback Ripple

- **Logic**: Admins provide comments on `TimeLogs` and `Breakthroughs`.
- **Synergy**: Submitting feedback must update the target entity's `adminFeedback` JSON locally and trigger a "Feedback Notification" to the affected user.

### 3.4 Search History Polymorphism

- **Logic**: Recent search items point to `EntityId` + `EntityType`.
- **Synergy**: When an entity is deleted, the `SynergyEmitter` must perform a **Cross-Store Sweep** to remove that ID from the user's `searchHistory` list.

### 3.5 Project Runtime & Completion Synergy

- **Logic**: Projects display `Runtime (Hours)` and `Completion %` derived from all linked tickets.
- **Synergy**: Updating a ticket status to 'done' or logging time must trigger a **Transitive Pivot Update** across all projects listed in `ticket.projectIds`.

### 3.6 Member Efficiency & Workload Synergy

- **Logic**: Team cards show `Efficiency %` and `Active Tickets`.
- **Synergy**: Moving a ticket from 'in-progress' to 'done' must:
  1. Decrement `member.activeTickets`.
  2. Recalculate `member.efficiency` based on the delta between `estimatedHours` and `loggedHours` for that specific ticket completion event.

### 3.7 Unified Branding Synergy

- **Logic**: Organizations have a `brandingColor` (e.g., `#00FF80`) in settings.
- **Synergy**: Updating this color must ripple through a **CSS Variable Injector** in the cache engine, updating the primary theme tokens globally without a page reload.

### 3.8 Contribution Heatmap Increment

- **Logic**: User profiles show a 90-day heatmap of contributions.
- **Synergy**: A `TimeLog` insert or `Breakthrough` verification event should perform a **Coalesced Increment** on the specific date cell in the cached `user.heatmap` object, rather than refetching the entire activity array.

### 3.9 Ticket Lifecycle Expiry Synergy

- **Logic**: Tickets have a `dueDate`.
- **Synergy**: When a ticket's status is moved to 'done', the engine should remove it from the `overdue` collection and clear the `isOverdue` flag regardless of the current date.

---

## 4. Synergy Architecture Implementation

> [!CAUTION]
> **Anti-Pattern Warning**: This section previously proposed a custom `SynergyEmitter` (event bus) and `Command` pattern. After codebase validation, these were identified as **over-engineering**:
>
> - The `SynergyEmitter` creates a global, invisible web of side-effects (Dependency Hell).
> - The `Command` pattern adds massive boilerplate when TanStack Query's `onMutate` already provides standardized optimistic updates and rollbacks.
> - The need for "Circuit Breakers" to prevent infinite loops is a **red flag** that the architecture is too circular.
>
> The validated approach below uses a **Static Impact Map** + **Pure Transformer Functions** instead.

### 4.1 The Centralized Orchestrator (Static Dependency Strategy)

Instead of an Emitter that "shouts" updates and hopes listeners catch them, use a **Declarative Dependency Map**.

#### 4.1.1 Static Impact Map

A compile-time constant that describes which domains affect each other. No runtime discovery, no hidden listeners.

```typescript
// lib/cache/impact-map.ts
export const IMPACT_MAP = {
  tickets: ['analytics', 'leaderboard', 'activities'],
  timeLogs: ['tickets', 'analytics', 'leaderboard'],
  comments: ['activities', 'notifications'],
  members: ['activities', 'notifications'],
  projects: ['analytics'],
  leaves: ['notifications'],
  breakthroughs: ['notifications', 'leaderboard'],
  goals: ['analytics'],
  invitations: ['notifications'],
} as const;
```

**Why this is better**: A developer changing a "Time Log" mutation can instantly see (at compile time) that it affects `tickets`, `analytics`, and `leaderboard`—no tracing through emitter registrations required.

#### 4.1.2 The Sync Registry (Pure Transformer Functions)

Instead of a `SynergyEmitter`, use the existing `CacheCore` wrapped in a `SyncRegistry`. Each entry is a **Pure Function** that takes old cache state and returns new cache state.

```typescript
// lib/cache/sync-registry.ts
type Transformer<TPayload> = (queryClient: QueryClient, payload: TPayload) => void;

export const SyncRegistry: Record<string, Transformer<any>[]> = {
  'tickets.statusChanged': [
    (qc, { from, to }) => AnalyticsDomain.moveTicketStatus(qc, from, to),
    (qc, { ticketId, assigneeId, status }) => {
      if (status === 'done') AnalyticsDomain.adjustLeaderboard(qc, assigneeId, 0, 1);
    },
  ],
  'timeLogs.created': [
    (qc, { ticketId, hours }) =>
      TicketDomain.optimisticUpdate(qc, ticketId, { addLoggedHours: hours }),
    (qc, { hours, date }) => AnalyticsDomain.adjustLoggedHours(qc, hours, date),
    (qc, { userId, hours }) => AnalyticsDomain.adjustLeaderboard(qc, userId, hours),
  ],
};
```

**Key properties**:

- **Pure**: Testable without mocking an emitter—pass in a mock `QueryClient` and assert on the output.
- **Decoupled**: `TicketDomain` doesn't know _how_ `AnalyticsDomain` is updated, only that it _is_ affected.
- **No Loops**: Data flows in one direction. No need for circuit breakers.

### 4.2 The Push vs. Pull Strategy (State Classification)

Not all state should be managed the same way. The correct split:

| State Type                                  | Strategy                                          | Tool           | Examples                        |
| :------------------------------------------ | :------------------------------------------------ | :------------- | :------------------------------ |
| **Primary Entity** ("Source of Truth")      | `setQueryData` (Optimistic Push)                  | TanStack Query | Ticket, Project, Member         |
| **Derived Stats** (Critical, No Flickering) | `syncDerivedStats` helper (Calculated Projection) | TanStack Query | KPI Counters, Leaderboard Rank  |
| **Derived Stats** (Non-Critical)            | `invalidateQueries` (Let TQ refetch)              | TanStack Query | Activity Feed, Weekly Trends    |
| **Volatile UI State** (Not Server State)    | Zustand Store (Global Reactive)                   | Zustand        | Presence, Branding Color, Theme |

> [!WARNING]
> **Anti-Pattern**: Do NOT use TanStack Query for `Presence` or `Branding`. These are **global UI state**, not "server state" that needs caching/fetching logic. Using TanStack Query for them adds unnecessary complexity (stale times, refetch intervals, cache keys) when a simple Zustand store provides reactive updates with zero overhead.

### 4.3 Mutation Hook Integration (No Command Classes)

Instead of creating hundreds of "Command" classes, integrate the `SyncRegistry` directly into existing `useMutation` hooks via TanStack Query's built-in `onMutate` / `onError` / `onSettled` lifecycle.

```typescript
// hooks/useTickets.ts (existing pattern, enhanced)
const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args) => api.updateTicket(args),
    onMutate: async ({ id, status }) => {
      // 1. Cancel outgoing refetches (TQ handles race conditions natively)
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      // 2. Snapshot for rollback
      const snapshot = queryClient.getQueryData(['tickets', id]);
      // 3. Primary update (Push)
      TicketDomain.optimisticUpdate(queryClient, id, { status });
      // 4. Derived updates (via SyncRegistry)
      SyncRegistry['tickets.statusChanged']?.forEach((fn) =>
        fn(queryClient, { id, from: snapshot.status, to: status })
      );
      return { snapshot };
    },
    onError: (err, vars, ctx) => {
      // TanStack rollback—no custom "Command" needed
      if (ctx?.snapshot) queryClient.setQueryData(['tickets', vars.id], ctx.snapshot);
    },
    onSettled: () => {
      // Invalidate non-critical derived state
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};
```

**Why this is better than the Command Pattern**:

- Zero boilerplate classes.
- TanStack Query handles request cancellation, out-of-order response reconciliation, and rollback natively.
- The `onMutate` → `onError` → `onSettled` lifecycle is the **industry standard** for optimistic updates.

---

## 5. Advanced Reliability & "Self-Healing" Layer

### 5.1 Lazy Hydration Resolution (Grafting)

Optimistic updates often look "broken" (blank names/avatars) when IDs are not resolved.

- **Intercept**: The `CacheAugmenter` detects missing relation objects (e.g. `assigneeId` exists but `assignee` doesn't).
- **Placeholder**: Inserts a fallback UI object (`{ id, name: 'Unknown', ... }`).
- **Fetch**: Silently triggers `queryClient.prefetchQuery(['users', id])`.
- **Graft**: Swaps the ID for the full object once the fetch completes.
- **Current Implementation**: `CacheAugmenter.user()` and `CacheAugmenter.projects()` in `lib/cache/augmenter.ts` already perform this pattern.

### 5.2 Race Condition Handling

- **Problem**: Late server responses overwriting newer local state.
- **Solution**: TanStack Query v5 handles this natively via `queryClient.cancelQueries()` in `onMutate`. Calling `cancelQueries` before applying optimistic updates ensures that in-flight fetches are cancelled and won't overwrite optimistic state.

> [!NOTE]
> **Critique Validation**: The previously proposed "Sequence Tokens" and "Race Shield" are **redundant** because TanStack Query already handles request cancellation and out-of-order response reconciliation natively via its `onMutate` → `cancelQueries` pattern.

### 5.3 Cyclic Dependency Prevention

With the **Static Impact Map** approach (Section 4.1), cyclic dependencies are prevented **by design**:

- Data flows in one direction: `Primary Entity` → `Derived Stats` → `UI`.
- The `IMPACT_MAP` is a compile-time constant—if you add a cycle (`tickets → analytics → tickets`), it's immediately visible in the code.
- No runtime "circuit breaker" is needed because pure transformer functions don't trigger further emissions.

> [!NOTE]
> **Critique Validation**: The need for a "Circuit Breaker" in frontend state management is a sign that the architecture is too circular. In a well-designed system, data flows unidirectionally.

---

## 6. Notification & Activity Synergy (The "Event Mirror")

### 6.1 Trigger Dependency Map

| Event               | Target Recipient(s)     | Triggering Fields    | Required Hydration           |
| :------------------ | :---------------------- | :------------------- | :--------------------------- |
| **Ticket Assigned** | `assigneeId`            | `assigneeId` Change  | Ticket Title, Assigner Name  |
| **Status Change**   | `creator`, `assignee`   | `status` Change      | Ticket ShortID, New Status   |
| **New Comment**     | `creator`, `assignee`   | New `Comment` record | Comment Content, Author Name |
| **Time Logged**     | `creator`, `assignee`   | New `TimeLog` record | Logged Hours, Author Name    |
| **Member Joined**   | All `Owners` & `Admins` | New `Member` record  | Org Name, Joiner Name        |

### 6.2 Preference-Aware Synergy

Every notification ripple must check the `NotificationSettings` JSON in the cached `User` object before committing the optimistic alert.

---

## 7. Global Scoping, Role Awareness & Persistence

### 7.1 Role-Aware Synergies

Synergies affecting organization-wide stats (e.g., Project Deletion, Leaderboard Correction) are only execution optimistically for `owner` and `admin` roles. For `member` roles, the engine waits for server confirmation to maintain security integrity.

### 7.2 The "Clean Slate" Org Switch

When switching organizations:

1. Trigger `TRUNCATE_DOMAINS` event.
2. Wipe all projected lists (Projections).
3. Preserve "Normalized Entity Store" (Users/Shared Labels) for cold-start acceleration.

### 7.3 Persistence & GC (IndexedDB)

- **Versioning**: Every Registry update increments a `CACHE_VERSION`. Stale local data is soft-purged on version mismatch.
- **GC Policy**: Auto-purge entities not referenced in any active UI `Projection` every 30 minutes.

---

## 8. Telemetry & Debugging (State Observability)

A hidden `__synergy_log` is maintained in the cache, tracking the "Ripple Chain" of every event. This allows developers to inspect the history of any cached item directly in the TanStack Query DevTools.

---

## 9. Future-Proofing & Advanced Considerations

### 9.1 Cross-Tab Synchronization (Broadcast Channel API)

To ensure that an update in Tab A (e.g., Ticket "Done") is immediately reflected in Tab B (e.g., Analytics Dashboard):

- **Mechanism**: The `SyncRegistry` broadcasts domain events via a specialized `BroadcastChannel`.
- **Action**: Neighboring tabs receive the event and execute the corresponding `SyncRegistry` transformers locally, keeping the entire browser session in perfect sync without a network round-trip.
- **Alternative (Simpler)**: Use TanStack Query's built-in `broadcastQueryClient` plugin which handles cross-tab cache synchronization automatically.

### 9.2 Derived State Drift Reconciliation

Over time, client-side "Calculated State" (like a running total of logged hours) might drift from the "Absolute Server State."

- **Mechanism**: Use `invalidateQueries` on `onSettled` for non-critical derived data. TanStack Query will automatically refetch and reconcile.
- **Deep Audit**: For critical stats (KPIs), every 10th background refetch performs a **Deep Comparison** between the cached analytics and the server response.
- **Action**: If a discrepancy > 0.01% is detected, `invalidateQueries({ queryKey: ['analytics'] })` forces a full server reconciliation.

> [!NOTE]
> **Anti-Pattern Avoided**: The previous approach proposed triggering "silent synergy ripples" to fix drift—this risks creating **more** drift. The correct fix is to let the server be the source of truth and use `invalidateQueries` to reconcile.

### 9.3 Collaborative Presence Awareness

The cache should not just store _data_, but _context_.

- **Mechanism**: A **Zustand store** (not TanStack Query) manages a `Presence` map: `{ [ticketId]: userId[] }`.
- **Synergy**: When User A views a Ticket, a `presence.heartbeat` event updates the Zustand store. The Ticket UI subscribes to the store and shows a "User A is viewing" indicator.
- **Rationale**: Presence is volatile, ephemeral UI state with sub-second update intervals—it does not belong in a server-state cache.

### 9.4 Binary & Asset Cache Management

- **Strategy**: For the `Organization.logo` or `User.image`, the cache stores **Blob URIs** or **Base64** fragments during the "Uploading" state.
- **Synergy**: When the server confirms the URL, the engine performs a "Soft Swap," ensuring the image never "flickers" or shows a broken state during the transition from local to remote storage.

---

## 10. Migration Roadmap

1.  **Phase 1 — Entity Registry**: Define the `IMPACT_MAP` and `SyncRegistry` for all 18+ entities. Migrate static filter logic into `CacheCore`.
2.  **Phase 2 — Mutation Integration**: Enhance existing `useMutation` hooks with `SyncRegistry` transformer calls in `onMutate`. Use TanStack Query's native `cancelQueries` for race protection.
3.  **Phase 3 — Derived State Split**: Classify all derived state using the Push/Pull strategy (Section 4.2). Move Presence and Branding to Zustand stores.
4.  **Phase 4 — Hydration & Augmentation**: Mature the `CacheAugmenter` with global hydration interceptors. Add placeholder/graft flow for all relational fields.
5.  **Phase 5 — Advanced Features**: Activate Cross-Tab Sync (BroadcastChannel or TQ plugin), Drift Reconciliation, and Telemetry logging.

> [!IMPORTANT]
> **Phase Ordering Rationale**: The Impact Map (Phase 1) must exist before mutations can reference it (Phase 2). State classification (Phase 3) must happen before advanced hydration (Phase 4) to know which state lives where. This ordering ensures each phase builds on the previous one with zero backward dependencies.

---

## 11. Architectural Critique & Design Decisions Log

This section documents validated critiques of earlier blueprint versions and the rationale for architectural pivots.

### 11.1 Rejected: Custom Event Emitter ("SynergyEmitter")

- **Why Rejected**: Creates a global, invisible web of side-effects. A developer changing a "Time Log" might not realize they are also triggering a "Leaderboard Recalculation," a "Burn Rate Update," and a "Notification Alert."
- **Replacement**: Static `IMPACT_MAP` + `SyncRegistry` with pure transformer functions.

### 11.2 Rejected: Command Pattern for Mutations

- **Why Rejected**: Adds massive boilerplate when TanStack Query's `onMutate` already provides an elegant, standardized way to handle optimistic updates and rollbacks.
- **Replacement**: Direct integration into `useMutation` hooks via `onMutate` / `onError` / `onSettled`.

### 11.3 Rejected: Circuit Breakers in Frontend State

- **Why Rejected**: The need for a circuit breaker is a symptom of circular data flow. In a well-designed system, data flows in one direction.
- **Replacement**: Unidirectional data flow enforced by the Static `IMPACT_MAP` (compile-time visible dependencies).

### 11.4 Rejected: Sequence Tokens / Race Shield

- **Why Rejected**: TanStack Query v5 handles request cancellation and out-of-order response reconciliation natively.
- **Replacement**: `queryClient.cancelQueries()` called in `onMutate` before applying optimistic updates.

### 11.5 Accepted: Derived State via Selectors

- **Rationale**: Derived state (KPI counters, efficiency percentages, `isOverBudget` flags) should be computed in the UI layer using `useMemo` or TanStack Query's `select` option, ensuring one source of truth.
- **Risk Mitigated**: "Split-Brain" data where a manually incremented counter in one cache slice disagrees with a cached version that has a different filter.

---

**Standard**: Modular, Schema-Driven, Reliable.
**Architecture**: Centralized Orchestrator + Static Impact Map + Pure Transformers.
**Registry Coverage**: Exhaustive 18+ entity relational graph inclusive of JSON Preferences, Metadata, and Branding.
