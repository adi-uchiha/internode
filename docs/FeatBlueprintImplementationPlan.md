# Feature Blueprint Management System — Full PRD & Integration Plan

> **Document Type**: Product Requirements Document (PRD) + Technical Integration Plan
> **Product**: Internode
> **Feature**: Feature Blueprint Management System
> **Author**: Aditya (CTO)
> **Status**: 🟡 DRAFT
> **Last Updated**: 2026-04-16

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State of Internode](#2-current-state-of-internode)
3. [Problem Statement](#3-problem-statement)
4. [Product Vision & Goals](#4-product-vision--goals)
5. [Stakeholders & Roles Within Internode](#5-stakeholders--roles-within-internode)
6. [Feature Requirements](#6-feature-requirements)
   - 6.1 Blueprint Lifecycle & Status Gates
   - 6.2 Blueprint Editor
   - 6.3 Comments & Review System
   - 6.4 Approval & Freezing
   - 6.5 Change Request Workflow
   - 6.6 Ticket Generation from Blueprint
   - 6.7 Versioning & History
   - 6.8 Notifications
7. [User Stories](#7-user-stories)
8. [Data Schema — Drizzle ORM](#8-data-schema--drizzle-orm)
9. [API Design](#9-api-design)
10. [UI Architecture & Page Map](#10-ui-architecture--page-map)
11. [RBAC & Permissions Matrix](#11-rbac--permissions-matrix)
12. [Integration with Existing Internode Systems](#12-integration-with-existing-internode-systems)
13. [State Machines](#13-state-machines)
14. [Error States & Edge Cases](#14-error-states--edge-cases)
15. [Technical Implementation Phases](#15-technical-implementation-phases)
16. [Ticket Breakdown](#16-ticket-breakdown)
17. [NOT in Scope](#17-not-in-scope)
18. [Open Questions](#18-open-questions)

---

## 1. Executive Summary

Internode is currently a high-quality Jira-like task management system with tickets, projects, kanban views, time logging, and analytics. The **Feature Blueprint Management System** elevates Internode from a task tracker into a **full-cycle product engineering platform** — one where a feature's lifecycle begins with a structured, reviewed, and approved specification document (the "Feature Blueprint") before any code or ticket is ever created.

The Feature Blueprint is a living document that captures the complete definition of a feature: business rules, user stories, data schemas, UI state machines, error matrices, approval gates, and the resulting technical tickets. Once frozen and CEO-approved, it becomes the immutable source of truth. Any subsequent changes require a formal Change Request (CR), which is logged and versioned.

This PRD defines every requirement, data model, API, UI page, and ticket needed to build this system inside Internode.

---

## 2. Current State of Internode

Understanding what already exists is critical before designing integrations.

### 2.1 Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router)                                       |
| Runtime       | Bun                                                           |
| Database      | Drizzle ORM + NeonDB (PostgreSQL)                             |
| Auth          | Better-Auth (session-based + API key support)                 |
| Styling       | Tailwind CSS v4 + Base UI                                     |
| State/Cache   | TanStack Query v5 with `CacheManager` synergy pattern         |
| Markdown      | `react-markdown` + `remark-gfm` + `MarkdownEditor` (existing) |
| Uploads       | Cloudinary (existing `useCloudinaryUpload`)                   |
| Notifications | In-app (`notifications` table) + Email (emailjs)              |
| MCP           | Existing MCP server for AI agent integrations                 |

### 2.2 Existing Entities

| Entity          | Table            | Notes                                                                                 |
| --------------- | ---------------- | ------------------------------------------------------------------------------------- |
| Organizations   | `organizations`  | Multi-tenant owner, `ticketCounter` for sequential IDs                                |
| Members         | `members`        | Role: `owner`, `admin`, `member`. `department`, `skillTags`                           |
| Projects        | `projects`       | Has `prefix`, `color`, `status`, `techStack`                                          |
| Tickets         | `tickets`        | `ticketId` (e.g., TASK12), status, priority, assignee, estimated/logged hours, labels |
| Ticket Projects | `ticketProjects` | M:N junction                                                                          |
| Time Logs       | `timeLogs`       | Per-ticket, per-user hours + notes                                                    |
| Comments        | `comments`       | Thread on tickets                                                                     |
| Activities      | `activities`     | Audit log per org                                                                     |
| Notifications   | `notifications`  | In-app notification system                                                            |
| Labels          | `labels`         | Org-scoped color labels                                                               |
| Invitations     | `invitations`    | Email-based org invites                                                               |

### 2.3 Existing RBAC

Three roles with the `PERMISSIONS` map in `lib/rbac.ts`:

- `owner` — Full control
- `admin` — Most operations
- `member` — Limited to own work

### 2.4 Existing Patterns

- **API Handler**: `withErrorHandler()` in `lib/api-handler.ts` — injects `session`, `orgId`, `orgRole`, `member` into every route handler.
- **Cache Manager**: `CacheManager` with optimistic update + server sync pattern via TanStack Query.
- **MarkdownEditor**: Full-featured editor in `components/shared/MarkdownEditor.tsx` with split/preview mode, image paste-to-upload, and toolbar.
- **MarkdownRenderer**: Styled renderer in `components/shared/MarkdownRenderer.tsx`.
- **Activity Logging**: `activities` table used as centralized audit log.
- **Notification System**: `notifications` table + `lib/notifications.ts` dispatch.

---

## 3. Problem Statement

Without a structured specification system, here is what breaks down:

1. **Features are coded from verbal/Slack descriptions** — no documentation trail, business rules are vague.
2. **PM misses business rules** (financial constraints, edge cases, state machines) — they're discovered mid-development, causing rework.
3. **No approval gate before development starts** — the CTO or CEO may course-correct after code is already written.
4. **Tickets are created ad-hoc** without being anchored to a written specification — duplicate work, orphan tickets, unclear scope.
5. **Post-freeze scope creep happens via Slack messages** — "quick updates" that bypass review.
6. **No version history for requirements** — if a feature changes, there is no record of what was agreed and when.

---

## 4. Product Vision & Goals

### Vision

Every feature in Internode must be born from a **Feature Blueprint** — a structured, versioned document that goes through formal review gates. No ticket should exist without a parent Blueprint. No Blueprint should be coded without being **FROZEN**.

### Goals

| Goal                                                                 | Measurement                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 100% of new features have a Blueprint before first ticket is created | `tickets.blueprintId IS NOT NULL` for all new tickets                  |
| Zero "verbal-only" requirement changes                               | All changes tracked as `change_requests` with approval                 |
| PM, CTO, CEO all sign off before FROZEN                              | Approval signatures recorded with timestamps                           |
| Blueprint-to-Ticket sync is automatic                                | `sync-tickets` API generates tickets from the Blueprint's ticket table |
| Comments on Blueprints are threaded and role-stamped                 | `blueprint_comments` replaces Slack requirement threads                |

---

## 5. Stakeholders & Roles Within Internode

How Internode's existing RBAC maps to the Blueprint process:

| Internode Role | Blueprint Role   | Permissions                                                                                |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `member`       | PM / Intern      | Can create DRAFT, write content, add comments, cannot approve or freeze                    |
| `admin`        | CTO / Senior Dev | Can approve PM_REVIEW gate, CTO_REVIEW gate, sync tickets, create CRs                      |
| `owner`        | CEO / Founder    | Can approve CEO_APPROVED and FROZEN gates; has final freeze authority; can reject any gate |

> **Rule**: New Blueprint gates require the `owner` or `admin` role for approval. Gate-specific enforcement is explicit (e.g., CEO gate → `owner` only).

---

## 6. Feature Requirements

### 6.1 Blueprint Lifecycle & Status Gates

A Blueprint moves through exactly 5 statuses in sequence. No gate can be skipped.

```
DRAFT → PM_REVIEW → CTO_REVIEW → CEO_APPROVED → FROZEN
                                                     │
                                              (CR logged here)
                                              CHANGE_REQUEST
```

| Status         | Who Sets It                            | Conditions                                 |
| -------------- | -------------------------------------- | ------------------------------------------ |
| `draft`        | Any `member`/`admin`/`owner` (creator) | Initial state on creation                  |
| `pm_review`    | Creator self-submits                   | At least title + description filled        |
| `cto_review`   | `admin` or `owner` approves PM_REVIEW  | PM_REVIEW gate comment required            |
| `ceo_approved` | `owner` approves CTO_REVIEW            | Business rules matrix non-empty            |
| `frozen`       | `owner` freezes CEO_APPROVED           | Approval comment required; sets `frozenAt` |

**Rejection**: Any approver can **reject** a gate, sending the Blueprint back to the previous status with a mandatory rejection reason. This is reversible — the PM can address feedback and re-submit.

**Frozen Lock**: Once `frozen`, the markdown body is **read-only**. All edits are blocked at the API level. Only Change Requests can modify it.

### 6.2 Blueprint Editor

Reuse the existing `MarkdownEditor` component. The editor renders the full Blueprint markdown — all 19 sections — as a single editable document.

**Editor behavior by status:**

| Status         | Edit Mode                                 | Toolbar                         |
| -------------- | ----------------------------------------- | ------------------------------- |
| `draft`        | Fully editable                            | Full toolbar                    |
| `pm_review`    | Editable (creator can pull back)          | Full toolbar                    |
| `cto_review`   | Read-only for PM, editable by admin/owner | Full toolbar for admin/owner    |
| `ceo_approved` | Read-only for admin, editable by owner    | Owner toolbar only              |
| `frozen`       | **Read-only for ALL**                     | No toolbar — "FROZEN" watermark |

The editor will be the main content area of the Blueprint detail page. A sticky right panel (or top header) shows the approval gate status.

### 6.3 Comments & Review System

Blueprints require a **threaded comment system** that is separate from ticket comments.

**Requirements:**

- Comments are scoped to a Blueprint (not a section).
- Comments can be marked as **Approval Gate Comments** — attached to a specific gate action (e.g., "CTO_REVIEW approved — [comment]").
- Comments made during rejection must include a mandatory reason.
- Each comment shows: avatar, role badge (`OWNER`/`ADMIN`/`MEMBER`), timestamp, content (markdown supported).
- Comments are **immutable** after posting (no edit/delete — audit trail).
  - Exception: `owner` can delete comments that violate conduct.
- A comment thread notification fires to all Blueprint participants.

### 6.4 Approval & Freezing

**Approval Flow (UI):**

The Blueprint detail page has a sticky **"Approval Panel"** at the top or as a right sidebar showing:

```
Gate 1: PM_REVIEW    ● Approved — PM (2026-04-02)
Gate 2: CTO_REVIEW   ● In Review
Gate 3: CEO_APPROVED ○ Pending
Gate 4: FROZEN       ○ Pending
```

- Each gate shows the approver name, timestamp, and comment.
- A **"Approve & Advance"** button is visible only to the eligible role for the current gate.
- A **"Reject Gate"** button opens a mandatory reason modal.
- Once FROZEN, a **"Create Change Request"** button replaces all action buttons.

### 6.5 Change Request Workflow

A Change Request (CR) is triggered when a FROZEN Blueprint needs modification.

**CR Flow:**

1. Any `admin` or `owner` clicks "Create Change Request".
2. They fill in: What changed, Why, Technical Impact, Timeline Impact, Affected Ticket IDs.
3. CR goes to `owner` for approval.
4. If approved: Blueprint status briefly becomes `cto_review` again (or stays `frozen` with the change applied and version incremented).
5. The CR is logged in the `change_requests` table and becomes part of the Blueprint's audit trail (Section 19 in the markdown).

**Business Rule**: A CR cannot delete ticket IDs from the Blueprint once they exist as live tickets in Internode. It can only add new tickets or modify metadata.

### 6.6 Ticket Generation from Blueprint

The most powerful integration: **Blueprint-to-Task Sync**.

**How it works:**

1. The Blueprint markdown contains a "15. Ticket Breakdown" section (as per `FEAT_BLUEPRINT_EXAMPLE.md`).
2. The user clicks **"Sync Tickets"** on the Blueprint detail page.
3. The system parses the markdown tables in Section 15.
4. For each row in the table (`Ticket ID`, `Title`, `Phase`, `Hours`, `Assigned`), the system creates or updates an Internode ticket with:
   - `title` → from table
   - `estimatedHours` → from table
   - `assigneeId` → resolved from `assignedTo` name to user
   - `projectIds` → derived from Blueprint's linked project
   - `labels` → auto-tag `blueprint:{blueprintId}` for traceability
   - `description` → auto-filled with "This ticket was generated from Blueprint [Blueprint Title] (Section 15). See: [link to blueprint]"
5. Tickets already synced are **updated, not duplicated** (idempotent sync via `externalTicketRef` stored on the ticket).
6. Once the Blueprint is **FROZEN**, ticket `estimatedHours` values are **locked** and cannot be changed from the Blueprint panel.

**Sync restriction**: Ticket sync is only available for Blueprints in `cto_review`, `ceo_approved`, or `frozen` status — not `draft` or `pm_review`.

### 6.7 Versioning & History

- Every time a Blueprint's body content is saved, a snapshot is written to `blueprint_versions`.
- The Blueprint detail page has a **"History"** tab showing a timeline of versions.
- Each version shows: version number, who saved it, when, and a diff view (before/after markdown).
- Gate actions (approvals, rejections) are also recorded in version history with the gate action type.
- **Rollback** is available for `admin`/`owner` only on non-frozen Blueprints.

### 6.8 Notifications

| Event                                   | Recipients                    | Channel        |
| --------------------------------------- | ----------------------------- | -------------- |
| Blueprint submitted for PM_REVIEW       | All `admin`/`owner` in org    | In-app + Email |
| Blueprint approved/rejected at any gate | Blueprint creator             | In-app         |
| Comment added on Blueprint              | All Blueprint participants    | In-app         |
| Blueprint FROZEN                        | All org `admin`/`owner`       | In-app + Email |
| Change Request created                  | All `owner`                   | In-app + Email |
| Change Request approved/rejected        | CR creator                    | In-app         |
| Tickets synced from Blueprint           | Blueprint creator + assignees | In-app         |

---

## 7. User Stories

### PM / Member Stories

| ID    | Story                                                                                                  | Priority |
| ----- | ------------------------------------------------------------------------------------------------------ | -------- |
| US-01 | As a PM, I want to create a new Blueprint in DRAFT so I can start documenting a feature                | P0       |
| US-02 | As a PM, I want to write Blueprint content in Markdown with a live preview so I can format it properly | P0       |
| US-03 | As a PM, I want to submit my Blueprint for PM_REVIEW so the CTO can begin the technical review         | P0       |
| US-04 | As a PM, I want to see comments from the CTO on my Blueprint so I know what to fix                     | P0       |
| US-05 | As a PM, I want to be notified when my Blueprint is approved or rejected at any gate                   | P1       |
| US-06 | As a PM, I want to see the approval history so I can track the progress                                | P1       |
| US-07 | As an Intern, I want to see Blueprints linked to my tickets so I understand the full spec              | P1       |

### CTO / Admin Stories

| ID    | Story                                                                                                 | Priority |
| ----- | ----------------------------------------------------------------------------------------------------- | -------- |
| US-08 | As a CTO, I want to see all Blueprints in CTO_REVIEW so I know what needs my attention                | P0       |
| US-09 | As a CTO, I want to add comments to a Blueprint during review so I can communicate feedback           | P0       |
| US-10 | As a CTO, I want to approve the CTO_REVIEW gate and advance the Blueprint to CEO_APPROVED             | P0       |
| US-11 | As a CTO, I want to reject a gate with a mandatory reason so the PM knows exactly what to fix         | P0       |
| US-12 | As a CTO, I want to sync tickets from the Blueprint's Section 15 table so tickets are auto-created    | P0       |
| US-13 | As a CTO, I want to see which tickets were generated from which Blueprint for full traceability       | P1       |
| US-14 | As a CTO, I want to create a Change Request on a frozen Blueprint so requirements can evolve formally | P1       |
| US-15 | As a CTO, I want to see the version history of a Blueprint so I can track how it evolved              | P1       |

### CEO / Owner Stories

| ID    | Story                                                                                         | Priority |
| ----- | --------------------------------------------------------------------------------------------- | -------- |
| US-16 | As a CEO, I want to see all Blueprints pending my approval so I can take action               | P0       |
| US-17 | As a CEO, I want to approve the CEO_APPROVED gate and freeze the Blueprint                    | P0       |
| US-18 | As a CEO, I want to add a final approval comment that is permanently visible on the Blueprint | P0       |
| US-19 | As a CEO, I want to reject any gate so I can enforce my product vision                        | P0       |
| US-20 | As a CEO, I want to approve Change Requests so formal changes are under my authority          | P1       |
| US-21 | As a CEO, I want to see a list of all FROZEN Blueprints so I have a complete product registry | P1       |

---

## 8. Data Schema — Drizzle ORM

These are the **new tables** to be added to the existing Drizzle schema. All follow existing conventions (`nanoid` PKs, `organizationId` FK with cascade, `createdAt`/`updatedAt` timestamps).

### 8.1 `blueprints`

```typescript
// db/schema/blueprints.ts

import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { projects } from './projects';
import { users } from './users';

export const BLUEPRINT_STATUSES = [
  'draft',
  'pm_review',
  'cto_review',
  'ceo_approved',
  'frozen',
] as const;

export type BlueprintStatus = (typeof BLUEPRINT_STATUSES)[number];

export const blueprints = pgTable(
  'blueprints',
  {
    id: text('id').primaryKey(), // nanoid
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Identity
    blueprintId: text('blueprint_id').notNull(), // e.g., "FB-2026-007"
    title: text('title').notNull(),
    slug: text('slug').notNull(), // URL-safe slug derived from title
    version: text('version').notNull().default('1.0'), // "1.0", "1.1", "2.0"

    // Content — full markdown body
    body: text('body').notNull().default(''),

    // Status gate
    status: text('status', { enum: BLUEPRINT_STATUSES }).notNull().default('draft'),

    // Linked project (optional — a Blueprint can exist without a project)
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),

    // Authors
    createdById: text('created_by_id')
      .notNull()
      .references(() => users.id),

    // Gate timestamps — set when each gate is passed
    pmReviewedAt: timestamp('pm_reviewed_at'),
    pmReviewedById: text('pm_reviewed_by_id').references(() => users.id),
    ctoReviewedAt: timestamp('cto_reviewed_at'),
    ctoReviewedById: text('cto_reviewed_by_id').references(() => users.id),
    ceoApprovedAt: timestamp('ceo_approved_at'),
    ceoApprovedById: text('ceo_approved_by_id').references(() => users.id),
    frozenAt: timestamp('frozen_at'),
    frozenById: text('frozen_by_id').references(() => users.id),

    // Ticket sync tracking
    lastSyncedAt: timestamp('last_synced_at'),
    syncedTicketCount: integer('synced_ticket_count').notNull().default(0),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('blueprints_organization_id_idx').on(table.organizationId),
    index('blueprints_status_idx').on(table.status),
    index('blueprints_project_id_idx').on(table.projectId),
    index('blueprints_created_by_id_idx').on(table.createdById),
  ]
);
```

### 8.2 `blueprint_comments`

```typescript
// db/schema/blueprints.ts (continued)

export const BLUEPRINT_COMMENT_TYPES = [
  'review', // Normal review comment
  'gate_approved', // Comment made when approving a gate
  'gate_rejected', // Comment made when rejecting a gate
  'cr_note', // Comment tied to a change request
] as const;

export const blueprintComments = pgTable(
  'blueprint_comments',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    blueprintId: text('blueprint_id')
      .notNull()
      .references(() => blueprints.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    type: text('type', { enum: BLUEPRINT_COMMENT_TYPES }).notNull().default('review'),

    // Which gate this comment is attached to (null for general comments)
    gateStatus: text('gate_status', { enum: BLUEPRINT_STATUSES }),

    content: text('content').notNull(), // Markdown supported

    createdAt: timestamp('created_at').notNull().defaultNow(),
    // Comments are intentionally immutable — no updatedAt
  },
  (table) => [
    index('blueprint_comments_blueprint_id_idx').on(table.blueprintId),
    index('blueprint_comments_user_id_idx').on(table.userId),
  ]
);
```

### 8.3 `blueprint_versions`

```typescript
// Snapshot table — written on every body save and gate action

export const blueprintVersions = pgTable('blueprint_versions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  blueprintId: text('blueprint_id')
    .notNull()
    .references(() => blueprints.id, { onDelete: 'cascade' }),
  version: text('version').notNull(), // e.g., "1.3"
  body: text('body').notNull(), // Full markdown body snapshot
  savedById: text('saved_by_id')
    .notNull()
    .references(() => users.id),
  changeNote: text('change_note'), // Optional summary of what changed
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### 8.4 `change_requests`

```typescript
export const CHANGE_REQUEST_STATUSES = ['pending', 'approved', 'rejected'] as const;

export const changeRequests = pgTable(
  'change_requests',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    blueprintId: text('blueprint_id')
      .notNull()
      .references(() => blueprints.id, { onDelete: 'cascade' }),

    crId: text('cr_id').notNull(), // e.g., "CR-003"

    requestedById: text('requested_by_id')
      .notNull()
      .references(() => users.id),

    // CR content
    title: text('title').notNull(),
    whatChanged: text('what_changed').notNull(),
    whyChanged: text('why_changed').notNull(),
    technicalImpact: text('technical_impact'),
    timelineImpact: text('timeline_impact'),
    affectedTicketIds: text('affected_ticket_ids'), // Comma-separated ticket IDs

    status: text('status', { enum: CHANGE_REQUEST_STATUSES }).notNull().default('pending'),

    reviewedById: text('reviewed_by_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    reviewNote: text('review_note'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('change_requests_blueprint_id_idx').on(table.blueprintId),
    index('change_requests_status_idx').on(table.status),
  ]
);
```

### 8.5 Modifications to Existing Tables

#### `tickets` table — add `blueprintId`

```typescript
// Add this field to the existing tickets table migration
blueprintId: text('blueprint_id').references(() => blueprints.id, { onDelete: 'set null' }),
externalTicketRef: text('external_ticket_ref'), // e.g., "CARE-101" — original ref from blueprint markdown table
```

This allows:

- Bidirectional lookup: ticket → blueprint and blueprint → all its tickets
- Idempotent sync: re-running sync checks `externalTicketRef` to avoid duplicates

#### `activities` table — extend `type` enum

```typescript
// Add these types to the existing activities.type enum:
// 'blueprint-created', 'blueprint-status', 'blueprint-commented',
// 'blueprint-frozen', 'blueprint-cr'
```

#### `notifications` table — extend `type` enum

```typescript
// Add these types to the existing notifications.type enum:
// 'blueprint-review', 'blueprint-approved', 'blueprint-rejected',
// 'blueprint-frozen', 'blueprint-cr', 'blueprint-comment'
```

> **Note**: Adding enum values in Drizzle/PostgreSQL requires a migration. All enum extensions must be done in a single migration file.

### 8.6 Relations

```typescript
// db/schema/relations.ts additions

export const blueprintsRelations = relations(blueprints, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [blueprints.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [blueprints.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [blueprints.createdById],
    references: [users.id],
    relationName: 'blueprint_creator',
  }),
  frozenBy: one(users, {
    fields: [blueprints.frozenById],
    references: [users.id],
    relationName: 'blueprint_freezer',
  }),
  comments: many(blueprintComments),
  versions: many(blueprintVersions),
  changeRequests: many(changeRequests),
  tickets: many(tickets),
}));

export const blueprintCommentsRelations = relations(blueprintComments, ({ one }) => ({
  blueprint: one(blueprints, {
    fields: [blueprintComments.blueprintId],
    references: [blueprints.id],
  }),
  user: one(users, {
    fields: [blueprintComments.userId],
    references: [users.id],
  }),
}));

export const changeRequestsRelations = relations(changeRequests, ({ one }) => ({
  blueprint: one(blueprints, {
    fields: [changeRequests.blueprintId],
    references: [blueprints.id],
  }),
  requestedBy: one(users, {
    fields: [changeRequests.requestedById],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [changeRequests.reviewedById],
    references: [users.id],
  }),
}));
```

---

## 9. API Design

All routes follow the existing Internode pattern: `withErrorHandler()` wrapper, org-scoped via `orgId`, role-checked via `orgRole`.

### 9.1 Blueprints CRUD

| Method   | Route                  | Auth                  | Description                                                                            |
| -------- | ---------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| `GET`    | `/api/blueprints`      | member+               | List blueprints for the org. Supports `?status=`, `?projectId=`, `?limit=`, `?offset=` |
| `POST`   | `/api/blueprints`      | member+               | Create a new blueprint in DRAFT                                                        |
| `GET`    | `/api/blueprints/[id]` | member+               | Get a single blueprint with relations (comments, versions, linked tickets)             |
| `PATCH`  | `/api/blueprints/[id]` | member+ (own) / admin | Update body and metadata. **Blocked if status = `frozen`**                             |
| `DELETE` | `/api/blueprints/[id]` | owner                 | Delete blueprint (only allowed in `draft` status)                                      |

### 9.2 Blueprint Actions

| Method | Route                               | Auth        | Description                                                                                     |
| ------ | ----------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `POST` | `/api/blueprints/[id]/submit`       | member+     | Submit DRAFT → PM_REVIEW                                                                        |
| `POST` | `/api/blueprints/[id]/approve`      | admin/owner | Advance the current gate. Body: `{ gateStatus, comment }`                                       |
| `POST` | `/api/blueprints/[id]/reject`       | admin/owner | Reject the current gate. Body: `{ gateStatus, reason }`. **Mandatory reason.**                  |
| `POST` | `/api/blueprints/[id]/freeze`       | owner       | FROZEN gate — final lock. Body: `{ comment }`                                                   |
| `POST` | `/api/blueprints/[id]/sync-tickets` | admin/owner | Parse Section 15 markdown table, create/update tickets. Returns `{ created, updated, skipped }` |

### 9.3 Blueprint Comments

| Method   | Route                                       | Auth    | Description                                                 |
| -------- | ------------------------------------------- | ------- | ----------------------------------------------------------- |
| `GET`    | `/api/blueprints/[id]/comments`             | member+ | Fetch all comments for a blueprint                          |
| `POST`   | `/api/blueprints/[id]/comments`             | member+ | Post a new comment. Body: `{ content, type?, gateStatus? }` |
| `DELETE` | `/api/blueprints/[id]/comments/[commentId]` | owner   | Delete a comment (owner-only)                               |

### 9.4 Blueprint Versions

| Method | Route                                               | Auth        | Description                                  |
| ------ | --------------------------------------------------- | ----------- | -------------------------------------------- |
| `GET`  | `/api/blueprints/[id]/versions`                     | member+     | List all versions of a blueprint             |
| `POST` | `/api/blueprints/[id]/versions/[versionId]/restore` | admin/owner | Restore to a prior version (non-frozen only) |

### 9.5 Change Requests

| Method | Route                                                 | Auth        | Description                           |
| ------ | ----------------------------------------------------- | ----------- | ------------------------------------- |
| `GET`  | `/api/blueprints/[id]/change-requests`                | member+     | List all CRs for a blueprint          |
| `POST` | `/api/blueprints/[id]/change-requests`                | admin/owner | Create a new CR on a frozen blueprint |
| `POST` | `/api/blueprints/[id]/change-requests/[crId]/approve` | owner       | Approve a CR                          |
| `POST` | `/api/blueprints/[id]/change-requests/[crId]/reject`  | admin/owner | Reject a CR with reason               |

### 9.6 Ticket-Blueprint Linking

| Method | Route                          | Auth    | Description                                                           |
| ------ | ------------------------------ | ------- | --------------------------------------------------------------------- |
| `GET`  | `/api/blueprints/[id]/tickets` | member+ | List all Internode tickets linked to this blueprint                   |
| `GET`  | `/api/tickets/[id]`            | member+ | **Existing** — now also returns `blueprintId` and `externalTicketRef` |

---

## 10. UI Architecture & Page Map

### 10.1 New Routes

All routes live under `/tasks/blueprints/` following the existing `/tasks/` App Router convention.

| Route                                           | Page Name        | Description                                                              |
| ----------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| `/tasks/blueprints`                             | Blueprints Index | List view — All blueprints for the org with status filter tabs           |
| `/tasks/blueprints/new`                         | New Blueprint    | Creation form (title, project link) → creates DRAFT, redirects to editor |
| `/tasks/blueprints/[id]`                        | Blueprint Detail | Main page — editor, approval panel, comments, ticket list                |
| `/tasks/blueprints/[id]/history`                | Version History  | Timeline view of all versions with diff capability                       |
| `/tasks/blueprints/[id]/change-requests`        | Change Requests  | List of CRs + form to create new one                                     |
| `/tasks/blueprints/[id]/change-requests/[crId]` | CR Detail        | Full CR review page                                                      |

### 10.2 Layout Integration

Blueprints is added as a new nav item in `tasks/layout.tsx`:

```typescript
// Add after 'Projects' in navItems:
{ label: 'Blueprints', href: '/tasks/blueprints', icon: 'ph:file-doc-duotone' },
```

Role filter: no role restriction — all members can view, but actions are gated.

### 10.3 Blueprint Index Page (`/tasks/blueprints`)

**Columns/Cards**:

- Blueprint ID (e.g., `FB-2026-007`)
- Title
- Status badge (color-coded by gate)
- Linked project
- Created by + date
- Last updated
- Ticket count (linked tickets)

**Filter Tabs**: `All` | `Draft` | `In Review` | `Frozen`

**Status Badge Colors**:
| Status | Color |
|--------|-------|
| `draft` | Gray |
| `pm_review` | Yellow |
| `cto_review` | Blue |
| `ceo_approved` | Purple |
| `frozen` | Green + lock icon |

**Empty State**: "No Blueprints yet. Features start here." with a "Create Blueprint" CTA (admin/owner only visible).

### 10.4 Blueprint Detail Page (`/tasks/blueprints/[id]`)

Three-panel layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  [HEADER]: Blueprint ID | Title | Status Badge | Action Buttons │
├──────────────────────────────┬──────────────────────────────────┤
│                              │  APPROVAL PANEL                  │
│  MARKDOWN EDITOR             │  ─────────────────────────────   │
│  (MarkdownEditor component   │  Gate 1: PM_REVIEW    ✅         │
│   — read-only if frozen)     │  Gate 2: CTO_REVIEW   🔵 Active  │
│                              │  Gate 3: CEO_APPROVED  ○ Pending │
│                              │  Gate 4: FROZEN        ○ Pending │
│                              │  ─────────────────────────────   │
│                              │  [Approve & Advance]             │
│                              │  [Reject Gate]                   │
├──────────────────────────────┴──────────────────────────────────┤
│  TABS: Comments | Linked Tickets | Versions | Change Requests   │
│                                                                  │
│  [Tab Content Area]                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Header action buttons (context-aware)**:

| Status         | Actions Shown                                |
| -------------- | -------------------------------------------- |
| `draft`        | "Edit" (pencil), "Submit for Review"         |
| `pm_review`    | "Mark as Reviewed" (admin)                   |
| `cto_review`   | "Approve → CEO" (admin), "Reject" (admin)    |
| `ceo_approved` | "Freeze Blueprint" (owner), "Reject" (owner) |
| `frozen`       | "Create Change Request", "Sync Tickets"      |

**Frozen state watermark**: A subtle `FROZEN` watermark renders over the editor area and the toolbar is hidden.

### 10.5 Comment Thread UI

Each comment card shows:

- Avatar + full name
- Role badge: `OWNER` / `ADMIN` / `MEMBER` (pill badge in primary color)
- Gate badge if applicable: `CTO_REVIEW APPROVED` / `PM_REVIEW REJECTED` (amber/green status chip)
- Timestamp
- Markdown-rendered content

Comment composer at the bottom of the comments tab — uses existing `MarkdownEditor` in compact mode.

### 10.6 Ticket Sync Result Modal

After clicking "Sync Tickets", a result modal shows:

```
✅ Ticket Sync Complete

Created:  9 new tickets
Updated:  3 existing tickets
Skipped:  2 (already up-to-date)

[View Linked Tickets] [Dismiss]
```

---

## 11. RBAC & Permissions Matrix

New permissions to add to `lib/rbac.ts`:

```typescript
// lib/rbac.ts — add to PERMISSIONS object:
CAN_CREATE_BLUEPRINT: ['admin', 'owner', 'member'],
CAN_EDIT_BLUEPRINT: ['admin', 'owner'],              // member can edit own in draft
CAN_APPROVE_PM_REVIEW: ['admin', 'owner'],
CAN_APPROVE_CTO_REVIEW: ['admin', 'owner'],
CAN_APPROVE_CEO: ['owner'],
CAN_FREEZE_BLUEPRINT: ['owner'],
CAN_REJECT_BLUEPRINT_GATE: ['admin', 'owner'],
CAN_CREATE_CHANGE_REQUEST: ['admin', 'owner'],
CAN_APPROVE_CHANGE_REQUEST: ['owner'],
CAN_SYNC_TICKETS_FROM_BLUEPRINT: ['admin', 'owner'],
CAN_VIEW_BLUEPRINT_HISTORY: ['admin', 'owner', 'member'],
CAN_DELETE_BLUEPRINT_COMMENT: ['owner'],
CAN_DELETE_BLUEPRINT: ['owner'],                     // Only in DRAFT status
```

**Gate Approval → Role Mapping:**

| Gate                       | Required Role                     | Note                                              |
| -------------------------- | --------------------------------- | ------------------------------------------------- |
| Submit (DRAFT → PM_REVIEW) | `member` or above (own blueprint) | Self-submission                                   |
| PM_REVIEW → CTO_REVIEW     | `admin` or `owner`                | Cannot be the same person who submitted (ideally) |
| CTO_REVIEW → CEO_APPROVED  | `admin` or `owner`                | Typically CTO/admin                               |
| CEO_APPROVED → FROZEN      | `owner` only                      | Final freeze is founder authority                 |
| Any gate rejection         | `admin` or `owner`                | Cannot reject own submission                      |

---

## 12. Integration with Existing Internode Systems

### 12.1 TanStack Query & Cache Manager

New query keys:

```typescript
// lib/cache/manager.ts additions
blueprints: {
  list: (params) => ['blueprints', params],
  detail: (id) => ['blueprints', id],
  comments: (id) => ['blueprints', id, 'comments'],
  versions: (id) => ['blueprints', id, 'versions'],
  changeRequests: (id) => ['blueprints', id, 'change-requests'],
  tickets: (id) => ['blueprints', id, 'tickets'],
}
```

New hooks to create in `hooks/useBlueprints.ts`:

- `useBlueprints(params?)` — list
- `useBlueprint(id)` — single
- `useCreateBlueprint()`
- `useUpdateBlueprint()`
- `useDeleteBlueprint()`
- `useSubmitBlueprint()`
- `useApproveGate()`
- `useRejectGate()`
- `useFreezeBlueprint()`
- `useSyncTickets()`
- `useBlueprintComments(id)`
- `useCreateBlueprintComment()`
- `useBlueprintVersions(id)`
- `useBlueprintChangeRequests(id)`
- `useCreateChangeRequest()`
- `useApproveChangeRequest()`

All mutations follow the existing `CacheManager` optimistic update + server sync pattern from `useTickets.ts`.

### 12.2 Activity Log Integration

Every gate action and ticket sync fires an activity entry:

```typescript
// Activities to log:
{ type: 'blueprint-created', action: `Created Blueprint "${title}"` }
{ type: 'blueprint-status', action: `Advanced Blueprint to ${newStatus}` }
{ type: 'blueprint-commented', action: `Commented on Blueprint "${title}"` }
{ type: 'blueprint-frozen', action: `Froze Blueprint "${title}"` }
{ type: 'blueprint-cr', action: `Created Change Request CR-XXX on "${title}"` }
```

The `activities` table's `type` enum must be extended in a migration.

### 12.3 Notification Integration

Use the existing `lib/notifications.ts` dispatch pattern to fire in-app notifications. For email notifications (gate advances and freeze events), use the existing email service via `emailjs`.

The `notifications` table's `type` enum must be extended in a migration.

### 12.4 Search Integration

Blueprints should be searchable via the existing `⌘K` search palette. Extend the existing `/api/search` route to also query `blueprints` by `title` and `blueprintId`.

The `searchHistory` table should support `entityType: 'blueprint'` (currently only `ticket`, `project`, `member`).

### 12.5 MCP Server Integration

The existing MCP server (`mcp/tools.ts`) exposes Internode operations to AI agents. Add blueprint tools:

```typescript
// New MCP tools to add to mcp/tools.ts:
create_blueprint(title, projectId?, description?)
list_blueprints(status?, limit?, offset?)
get_blueprint(blueprintId)
approve_blueprint_gate(blueprintId, comment)
sync_blueprint_tickets(blueprintId)
create_change_request(blueprintId, title, whatChanged, whyChanged)
```

### 12.6 Ticket Detail Page — Blueprint Backlink

The existing ticket detail page at `/tasks/ticket/[id]` should show a **"Source Blueprint"** link section when `ticket.blueprintId` is set:

```
📄 Source Blueprint
   FB-2026-007 — Expert Consultation Completion & Follow-Up [FROZEN]
   Section: 15.1 Backend Tickets
   → View Blueprint
```

This closes the loop: from any ticket, you can navigate directly to its specification.

---

## 13. State Machines

### 13.1 Blueprint Status State Machine

```
[CREATE]
    │
    ▼
  DRAFT ──(self-submit)──► PM_REVIEW ──(admin approve)──► CTO_REVIEW
    ▲                          │                               │
    │                    (reject)                        (reject)
    │                          │                               │
    │                          ▼                               ▼
    │                      (back to DRAFT)           (back to PM_REVIEW)
    │
    │                   CTO_REVIEW ──(admin/owner approve)──► CEO_APPROVED
    │                                                              │
    │                                                       (reject)
    │                                                              │
    │                                                    (back to CTO_REVIEW)
    │
    │               CEO_APPROVED ──(owner approve)──► FROZEN
    │                                                     │
    │                                               [immutable]
    │                                                     │
    └───────────────────────── (CR approved) ── CHANGE applied, version++
```

### 13.2 Change Request State Machine

```
PENDING ──(owner approve)──► APPROVED ──► Blueprint body updated, version++
        │
        └──(admin/owner reject)──► REJECTED (terminal)
```

---

## 14. Error States & Edge Cases

| Scenario                                                 | API Response                                   | UI Behavior                                                 |
| -------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Edit attempt on FROZEN blueprint                         | `403 BLUEPRINT_FROZEN`                         | Editor is read-only; error toast if attempted via API       |
| Approve gate out of sequence (e.g., skip PM_REVIEW)      | `400 INVALID_GATE_TRANSITION`                  | Action button hidden; API guard in place                    |
| Member tries to approve a gate                           | `403 INSUFFICIENT_ROLE`                        | Approve button not rendered for `member`                    |
| Sync tickets when status is `draft`                      | `400 BLUEPRINT_NOT_READY_FOR_SYNC`             | Sync button not shown for `draft`/`pm_review`               |
| Ticket sync finds duplicate `externalTicketRef`          | No new ticket created; existing ticket updated | Sync result shows "Updated: N" count                        |
| Markdown Section 15 table is malformed/missing           | `400 SECTION_15_PARSE_ERROR`                   | Error toast: "Ticket Breakdown section could not be parsed" |
| CR created on non-frozen blueprint                       | `400 BLUEPRINT_NOT_FROZEN`                     | CR button only visible on `frozen`                          |
| CR approved but blueprint body edit fails                | Transactional rollback                         | Error toast; CR stays `pending`                             |
| Blueprint deleted with live tickets                      | `409 HAS_LINKED_TICKETS`                       | Cannot delete; must unlink tickets first                    |
| Gate approved by same user who submitted (self-approval) | Warn (not block)                               | Warning banner: "You are approving your own submission"     |
| Comment posted on deleted blueprint                      | `404 BLUEPRINT_NOT_FOUND`                      | Redirect to blueprints list                                 |
| Version restore on frozen blueprint                      | `403 BLUEPRINT_FROZEN`                         | Restore button not shown on frozen; API guard in place      |

---

## 15. Technical Implementation Phases

### Phase 1: Schema & Core API (Week 1)

| Task                                         | Description                      | Est. |
| -------------------------------------------- | -------------------------------- | ---- |
| DB schema: `blueprints` table                | Write Drizzle schema + migration | 3h   |
| DB schema: `blueprint_comments` table        | Write Drizzle schema + migration | 1h   |
| DB schema: `blueprint_versions` table        | Write Drizzle schema + migration | 1h   |
| DB schema: `change_requests` table           | Write Drizzle schema + migration | 1h   |
| DB schema: Extend `tickets.blueprintId`      | Add column + migration           | 1h   |
| DB schema: Extend `activities.type` enum     | Migration                        | 1h   |
| DB schema: Extend `notifications.type` enum  | Migration                        | 1h   |
| Run `db:generate` + `db:migrate`             | Apply all migrations to NeonDB   | 1h   |
| API: `GET/POST /api/blueprints`              | List + create endpoints          | 3h   |
| API: `GET/PATCH/DELETE /api/blueprints/[id]` | Detail + update + delete         | 3h   |

**Phase 1 Total: ~16h**

### Phase 2: Gate Actions & Comments API (Week 1–2)

| Task                                             | Description                    | Est. |
| ------------------------------------------------ | ------------------------------ | ---- |
| API: `POST /api/blueprints/[id]/submit`          | DRAFT → PM_REVIEW              | 2h   |
| API: `POST /api/blueprints/[id]/approve`         | Gate advance logic             | 3h   |
| API: `POST /api/blueprints/[id]/reject`          | Gate reject + mandatory reason | 2h   |
| API: `POST /api/blueprints/[id]/freeze`          | Freeze + lock body             | 2h   |
| API: `GET/POST /api/blueprints/[id]/comments`    | Comments CRUD                  | 2h   |
| API: `GET /api/blueprints/[id]/versions`         | Version list                   | 1h   |
| API: `POST .../versions/[vId]/restore`           | Restore version                | 2h   |
| Activity + Notification dispatch on gate actions | Reuse existing patterns        | 2h   |

**Phase 2 Total: ~16h**

### Phase 3: Ticket Sync & Change Requests API (Week 2)

| Task                                                 | Description                          | Est. |
| ---------------------------------------------------- | ------------------------------------ | ---- |
| Markdown parser: Section 15 table extractor          | Regex/AST parse of ticket table rows | 4h   |
| API: `POST /api/blueprints/[id]/sync-tickets`        | Idempotent ticket creation/update    | 5h   |
| API: `GET /api/blueprints/[id]/tickets`              | List linked tickets                  | 1h   |
| API: `GET/POST /api/blueprints/[id]/change-requests` | CR CRUD                              | 3h   |
| API: `POST .../change-requests/[crId]/approve`       | CR approval flow                     | 2h   |
| API: `POST .../change-requests/[crId]/reject`        | CR rejection                         | 1h   |

**Phase 3 Total: ~16h**

### Phase 4: UI — Blueprint Index & New Blueprint (Week 2–3)

| Task                                       | Description                       | Est. |
| ------------------------------------------ | --------------------------------- | ---- |
| `hooks/useBlueprints.ts`                   | All TanStack Query hooks          | 6h   |
| Nav item: Blueprints in `tasks/layout.tsx` | Add nav link                      | 0.5h |
| Page: `/tasks/blueprints`                  | List page with status tabs, cards | 6h   |
| Page: `/tasks/blueprints/new`              | Creation form                     | 3h   |

**Phase 4 Total: ~15.5h**

### Phase 5: UI — Blueprint Detail & Editor (Week 3)

| Task                                        | Description                                 | Est. |
| ------------------------------------------- | ------------------------------------------- | ---- |
| Page: `/tasks/blueprints/[id]` layout       | Three-panel layout (editor, approval, tabs) | 4h   |
| Approval Panel component                    | Gate status visualization + action buttons  | 5h   |
| Editor integration (reuse `MarkdownEditor`) | Frozen-state read-only mode + watermark     | 3h   |
| Header action buttons (context-aware)       | All states/roles                            | 3h   |
| Comments tab                                | Thread list + composer                      | 4h   |
| Linked Tickets tab                          | List of synced tickets with status badges   | 3h   |
| Ticket Sync modal                           | Post-sync result modal                      | 2h   |

**Phase 5 Total: ~24h**

### Phase 6: UI — History, Change Requests & Backlinks (Week 3–4)

| Task                                           | Description                               | Est. |
| ---------------------------------------------- | ----------------------------------------- | ---- |
| Page: `/tasks/blueprints/[id]/history`         | Version timeline + diff view              | 6h   |
| Page: `/tasks/blueprints/[id]/change-requests` | CR list + create form                     | 5h   |
| Page: `.../change-requests/[crId]`             | CR detail + approve/reject                | 3h   |
| Ticket detail backlink to Blueprint            | "Source Blueprint" section on ticket page | 2h   |
| Search integration for blueprints              | Extend `/api/search` + `⌘K` results       | 3h   |

**Phase 6 Total: ~19h**

### Phase 7: MCP & Polish (Week 4)

| Task                                  | Description                       | Est. |
| ------------------------------------- | --------------------------------- | ---- |
| MCP tools for blueprints              | Add 6 new tools to `mcp/tools.ts` | 4h   |
| Email notifications                   | Gate advance + freeze emails      | 3h   |
| E2E testing: full blueprint lifecycle | Draft → FROZEN + ticket sync      | 4h   |
| E2E testing: change request flow      | CR create → approve               | 2h   |
| Bug fixing + polish                   | Buffer                            | 6h   |

**Phase 7 Total: ~19h**

---

## 16. Ticket Breakdown

### Backend API

| Ticket ID | Title                                                                                   | Phase | Hours | Assigned |
| --------- | --------------------------------------------------------------------------------------- | ----- | ----- | -------- |
| BP-001    | DB: Schema — blueprints, blueprint_comments, blueprint_versions, change_requests tables | 1     | 6h    | CTO      |
| BP-002    | DB: Migration — extend tickets.blueprintId, activities.type, notifications.type enums   | 1     | 4h    | CTO      |
| BP-003    | DB: Run db:generate + db:migrate + verify NeonDB                                        | 1     | 1h    | CTO      |
| BP-004    | DB: Drizzle relations for all new tables                                                | 1     | 2h    | CTO      |
| BP-005    | API: GET + POST /api/blueprints                                                         | 1     | 3h    | CTO      |
| BP-006    | API: GET + PATCH + DELETE /api/blueprints/[id]                                          | 1     | 3h    | CTO      |
| BP-007    | API: POST .../submit — DRAFT → PM_REVIEW                                                | 2     | 2h    | CTO      |
| BP-008    | API: POST .../approve — Gate advance with RBAC                                          | 2     | 3h    | CTO      |
| BP-009    | API: POST .../reject — Gate reject with mandatory reason                                | 2     | 2h    | CTO      |
| BP-010    | API: POST .../freeze — Final lock                                                       | 2     | 2h    | CTO      |
| BP-011    | API: GET + POST .../comments                                                            | 2     | 2h    | CTO      |
| BP-012    | API: GET .../versions + POST .../versions/[vId]/restore                                 | 2     | 3h    | CTO      |
| BP-013    | API: Activity + Notification dispatch on all gate actions                               | 2     | 2h    | CTO      |
| BP-014    | API: Markdown Section 15 parser (ticket table extractor)                                | 3     | 4h    | CTO      |
| BP-015    | API: POST .../sync-tickets — Idempotent ticket create/update                            | 3     | 5h    | CTO      |
| BP-016    | API: GET .../tickets — List linked tickets                                              | 3     | 1h    | CTO      |
| BP-017    | API: GET + POST .../change-requests                                                     | 3     | 3h    | CTO      |
| BP-018    | API: POST .../change-requests/[crId]/approve + /reject                                  | 3     | 3h    | CTO      |

### Frontend

| Ticket ID | Title                                                                 | Phase | Hours | Assigned |
| --------- | --------------------------------------------------------------------- | ----- | ----- | -------- |
| BP-019    | Hooks: useBlueprints.ts — all TanStack Query hooks                    | 4     | 6h    | Intern   |
| BP-020    | Nav: Add Blueprints nav item to tasks/layout.tsx                      | 4     | 0.5h  | Intern   |
| BP-021    | Page: /tasks/blueprints — list with filter tabs + status cards        | 4     | 6h    | Intern   |
| BP-022    | Page: /tasks/blueprints/new — creation form                           | 4     | 3h    | Intern   |
| BP-023    | Component: ApprovalPanel — gate status visualization + action buttons | 5     | 5h    | Intern   |
| BP-024    | Page: /tasks/blueprints/[id] — three-panel layout                     | 5     | 4h    | Intern   |
| BP-025    | Feature: Editor frozen-state read-only mode + watermark               | 5     | 3h    | Intern   |
| BP-026    | Feature: Header action buttons (all states/roles)                     | 5     | 3h    | Intern   |
| BP-027    | Component: CommentThread — list + composer                            | 5     | 4h    | Intern   |
| BP-028    | Component: LinkedTicketsTab — synced ticket list                      | 5     | 3h    | Intern   |
| BP-029    | Component: TicketSyncModal — post-sync result                         | 5     | 2h    | Intern   |
| BP-030    | Page: /tasks/blueprints/[id]/history — version timeline               | 6     | 6h    | Intern   |
| BP-031    | Page: /tasks/blueprints/[id]/change-requests — CR list + form         | 6     | 5h    | Intern   |
| BP-032    | Page: .../change-requests/[crId] — CR detail                          | 6     | 3h    | Intern   |
| BP-033    | Feature: Ticket detail backlink to Blueprint                          | 6     | 2h    | Intern   |
| BP-034    | Feature: Search integration for blueprints in ⌘K                      | 6     | 3h    | Intern   |

### MCP & Infrastructure

| Ticket ID | Title                                                    | Phase | Hours | Assigned |
| --------- | -------------------------------------------------------- | ----- | ----- | -------- |
| BP-035    | MCP: Add 6 blueprint tools to mcp/tools.ts               | 7     | 4h    | CTO      |
| BP-036    | Email: Gate advance + freeze notifications               | 7     | 3h    | Intern   |
| BP-037    | Testing: E2E — Draft → FROZEN full lifecycle             | 7     | 4h    | CTO      |
| BP-038    | Testing: E2E — Change Request create → approve → applied | 7     | 2h    | CTO      |
| BP-039    | Bug fix + polish buffer                                  | 7     | 6h    | All      |

---

## 17. NOT in Scope

These are explicitly excluded from this implementation. Each would require its own Blueprint if prioritized.

| Feature                                            | Reason Excluded                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Real-time collaborative editing (like Google Docs) | Requires WebSocket infrastructure not yet in Internode                                       |
| Figma embed within Blueprint                       | Figma API OAuth is a separate integration project                                            |
| AI-assisted business rules generation              | Complex LLM integration; MCP tools cover the agent side                                      |
| Blueprint templates                                | Useful but not core — the `FEAT_BLUEPRINT_EXAMPLE.md` file serves as manual template for now |
| Public Blueprint sharing (outside org)             | The org-scoped access model is the core security contract                                    |
| Blueprint PDF export                               | V2 enhancement                                                                               |
| Automated blueprint-from-Figma                     | Too speculative — Figma to markdown is unreliable                                            |
| Blueprint approval mobile app                      | Internode is web-only currently                                                              |

---

## 18. Open Questions

These must be answered before Phase 3 begins:

| #   | Question                                                                                                        | Who Decides | Decision Needed By |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Q1  | Should members be able to see ALL blueprints in the org or only ones they are mentioned in?                     | CEO/CTO     | Before Phase 4     |
| Q2  | Should the Section 15 parser be strict (error if table malformed) or lenient (skip malformed rows)?             | CTO         | Before Phase 3     |
| Q3  | Should FROZEN blueprints be deletable by owner if no live tickets are linked?                                   | CTO         | Before Phase 3     |
| Q4  | Should the CTO be blocked from self-approving their own Blueprint at CTO_REVIEW?                                | CEO         | Before Phase 2     |
| Q5  | Should blueprint versions be auto-saved on every keystroke (debounced) or only on explicit "Save" click?        | CTO         | Before Phase 5     |
| Q6  | What is the retention policy for version history? (All time vs. last N versions)                                | CTO         | Before Phase 6     |
| Q7  | Should interns/members be notified about ALL Blueprint activity in the org or only blueprints assigned to them? | CEO         | Before Phase 7     |

---

## Appendix A: Reference Files

| File                                     | Purpose                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `docs/FEAT_BLUEPRINT_EXAMPLE.md`         | Gold standard example of a complete blueprint — use as the reference markdown structure |
| `db/schema/tickets.ts`                   | Current ticket schema — blueprint fields are additive                                   |
| `db/schema/system.ts`                    | Activities + notifications schema being extended                                        |
| `lib/rbac.ts`                            | RBAC — being extended with blueprint permissions                                        |
| `lib/api-handler.ts`                     | `withErrorHandler` — all blueprint API routes use this wrapper                          |
| `components/shared/MarkdownEditor.tsx`   | Reused as the blueprint body editor                                                     |
| `components/shared/MarkdownRenderer.tsx` | Reused for read-only blueprint rendering                                                |
| `hooks/useTickets.ts`                    | Pattern reference for `useBlueprints.ts`                                                |
| `mcp/tools.ts`                           | MCP server — being extended with blueprint tools                                        |

---

## Appendix B: Total Effort Summary

| Category                              | Tickets          | Est. Hours |
| ------------------------------------- | ---------------- | ---------- |
| Backend (DB + API)                    | BP-001 to BP-018 | ~51h       |
| Frontend (Hooks + Pages + Components) | BP-019 to BP-034 | ~60h       |
| MCP + Email + Testing                 | BP-035 to BP-039 | ~19h       |
| **Total**                             | **39 tickets**   | **~130h**  |

**Suggested Timeline**: 4 weeks with CTO (backend) + 2 interns (frontend) working in parallel.

| Week   | CTO Focus                          | Intern Focus                                   |
| ------ | ---------------------------------- | ---------------------------------------------- |
| Week 1 | Phase 1 + Phase 2 (DB + Gate APIs) | Phase 4 (Hooks + Index page + New page)        |
| Week 2 | Phase 3 (Ticket Sync + CR APIs)    | Phase 5 (Blueprint Detail page)                |
| Week 3 | Phase 7 (MCP tools, E2E tests)     | Phase 6 (History, CR pages, backlinks, search) |
| Week 4 | Code review, bug fixes             | Bug fixes + polish                             |
