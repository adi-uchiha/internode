# Multi-Tenant Architecture & Technical Implementation Guide

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture & Limitations](#2-current-architecture--limitations)
3. [Core Multi-Tenancy Strategy](#3-core-multi-tenancy-strategy)
4. [Database Schema Redesign](#4-database-schema-redesign)
5. [Authentication & Better-Auth Integration](#5-authentication--better-auth-integration)
6. [Identity, Access Management (IAM) & Roles](#6-identity-access-management-iam--roles)
7. [Organization Management Flow](#7-organization-management-flow)
8. [Invitation & Onboarding Flow](#8-invitation--onboarding-flow)
9. [Routing & UI Strategy](#9-routing--ui-strategy)
10. [Data Migration Strategy](#10-data-migration-strategy)
11. [Detailed Implementation Roadmap](#11-detailed-implementation-roadmap)
12. [Potential Complications & Mitigations](#12-potential-complications--mitigations)
13. [Security Considerations](#13-security-considerations)
14. [Code Snippet Appendices](#14-code-snippet-appendices)

---

## 1. Executive Summary

This document outlines the comprehensive technical strategy and step-by-step implementation plan for transitioning the `Internode` application from a single-tenant architecture (with pseudo-multi-tenancy via simple string columns) into a fully functional, scalable, and secure Multi-Tenant application.

The goal is to allow independent organizations (e.g., tech companies, bootcamps, internal departments) to use Internode simultaneously, ensuring strict data isolation, customizable organization management, secure member invitations, and varying access control levels. This document will serve as the architectural blueprint for developers implementing this transition, detailing schema changes using Drizzle ORM, authentication integration using `better-auth` (with its organization plugin), routing modifications in Next.js (App Router), and comprehensive migration strategies.

---

## 2. Current Architecture & Limitations

### 2.1 Current Database State

Upon reviewing the existing codebase (specifically the `db/schema/` directory and `lib/auth.ts`), the application currently manages "organizations" as simple string properties on the global `users` table:

```typescript
// db/schema/users.ts snippets
import { text } from 'drizzle-orm/pg-core';
// ...
organizationName: text('organization_name').default('InternHub Central'),
organizationDomain: text('organization_domain').default('internhub-hq'),
```

### 2.2 Limitations of the Current Approach

1. **No True Data Isolation:** The core definition of SaaS multi-tenancy is data isolation. Currently, if two users from different organizations create tickets or projects, there is no structural boundary preventing one organizational user from querying another organization's data. Everything relies on implicit or missing `WHERE` clauses.
2. **No Organization Entity:** There is no centralized `organizations` table. This means we cannot store organization-wide settings such as billing plans, custom branding (logos, colors), SSO specific settings, or external integrations (like Jira or GitHub webhooks).
3. **Mismatched Invitation Logic:** The `invites` table lacks an `organizationId`. An invite simply contains an email, a role, and the `invitedById`. This assumes a globally shared environment. When a user accepts an invite, it is not robustly tying them to the inviter's organization.
4. **Manual Admin Creation:** System administrators currently must be created manually in the database. Furthermore, there is no concept of an "Organization Owner" who can manage their specific workspace autonomously.
5. **No Support for Multiple Workspaces:** A user is strictly bound to the text fields on their user record. In a modern SaaS, a user (e.g., an external contractor or consultant) might need to belong to multiple organizations and switch contexts seamlessly.

---

## 3. Core Multi-Tenancy Strategy

There are three primary models for multi-tenancy in relational databases:

1. **Database-per-Tenant:** Highest isolation, highest cost.
2. **Schema-per-Tenant:** Medium isolation, complex migrations.
3. **Logical Isolation (Pooled Database):** Lowest infrastructure cost, easiest migrations, requires rigorous application-level filtering.

### 3.1 Logical Isolation Model

We will adopt the **Logical Isolation** model. All organizations will share the same physical Postgres database and tables. Every tenant-specific record (tickets, projects, members) will strictly require an `organizationId` foreign key.

- **Pros:** Cost-effective, straightforward Drizzle migrations, easy to manage connection pools (especially important with Neon serverless databases).
- **Cons:** Requires rigorous query filtering to prevent cross-tenant data leakage.

_Future Consideration: Row-Level Security (RLS) can be implemented at the Postgres level using Drizzle to enforce `organizationId` filtering automatically at the database level. For the initial transition, however, we will rely on application-level filtering via Data Access Objects (DAOs)._

### 3.2 The Better-Auth Organization Plugin

Instead of building custom logic from scratch—which includes handling organization creation, user-to-org member mapping, role validation, active organization switching, and invitation cryptographic token generation—we will use the `@better-auth/organization` plugin.

- Automatically handles `organization`, `member`, and `invitation` schemas.
- Exposes pre-built TRPC-like API routes for inviting members, accepting invites, and updating roles.
- Integrates seamlessly into the session cookie, automatically managing an `activeOrganizationId`.

---

## 4. Database Schema Redesign

To correctly support multi-tenancy, we must heavily refactor our Drizzle schema.

### 4.1 System-Level vs. Tenant-Level Data

We must categorize all database tables into two distinct buckets to understand where `organizationId` is required.

1. **System-Level (Global):**
   - `users`: Core identity (email, password hash, global role).
   - `sessions`: Authentication sessions.
   - `accounts`: OAuth providers (GitHub, Google, etc.).
   - `verifications`: Email verification tokens.
2. **Tenant-Level (Org-specific):**
   - `organizations` (NEW)
   - `members` (NEW mapping table)
   - `invitations` (NEW/REPLACING `invites`)
   - `tickets`: Needs `organizationId`.
   - `projects`: Needs `organizationId`.
   - `goals`: Needs `organizationId`.
   - `breakthroughs`: Needs `organizationId`.
   - `leaves`: Needs `organizationId`.
   - `labels`: Needs `organizationId`.
   - `activities`: Needs `organizationId` (Prevent leak of actions across orgs if user is in multiple).
   - `notifications`: Needs `organizationId` (To filter targeted notifications per active workspace).
   - `timeLogs`: Needs `organizationId`.
   - `comments`: Needs `organizationId`.
   - `projectMembers`: Needs `organizationId` or strict validation logic against parent project.

### 4.2 New Tables (Provided by Better-Auth Org Plugin)

We will introduce three new tables. These must be defined in `db/schema/` to match what `better-auth` expects under the hood.

#### `schema/organizations.ts`

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: text('metadata'), // JSON string for custom org settings
});
```

#### `schema/members.ts`

This acts as a junction table between users and organizations, supporting many-to-many relationships.

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const members = pgTable('members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // ENUM: owner, admin, member
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

#### `schema/invitations.ts`

This will entirely replace the existing `schema/invites.ts`.

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('pending'), // ENUM: pending, accepted, rejected, canceled
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 4.3 Modifying Existing Tenant-Level Tables

Every single domain layer business entity in the system must be updated to include an `organizationId`. We will use Drizzle's relational features to enforce this.

#### Example: Modifying `tickets.ts`

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
// ... other imports

export const tickets = pgTable('tickets', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // ... existing fields untouched (e.g., title, description, status, assigneeId)
});
```

_Crucial Note on Nullability:_ During the initial database migration, we cannot strictly set `notNull()` because existing rows in production will fail to migrate. See the "Data Migration Strategy" below.

### 4.4 Modifying Users Table

We must clean up the technical debt in `schema/users.ts` to fully rely on the `members` mapping table.

```typescript
// db/schema/users.ts changes:
// 1. DELETE THESE LINES:
// organizationName: text('organization_name').default('InternHub Central'),
// organizationDomain: text('organization_domain').default('internhub-hq'),

// 2. KEEP THIS LINE:
// role: text('role', { enum: ['admin', 'member'] })
// Note: This 'role' represents the GLOBAL System Admin, not the Org context role.
```

### 4.5 Modifying `lib/auth.ts` Additional Fields

We must also remove the removed user columns from the `betterAuth` configuration. If we do not remove them from `user.additionalFields`, the Better Auth adapter will throw TypeErrors complaining about missing database columns.

```typescript
// In lib/auth.ts, inside betterAuth({ user: { additionalFields: { ... } } })
// DELETE THESE LINES:
// organizationName: { type: 'string' },
// organizationDomain: { type: 'string' },
```

### 4.6 Modifying Schema Index & Relations (`index.ts` & `relations.ts`)

Adding new tables and modifying existing ones demands updating the Drizzle exports and relations mapping, otherwise `db.query` relational fetching will fail:

1. **`schema/index.ts`:**
   - Remove `export * from './invites';`
   - Add exports for new tables: `export * from './organizations';`, `export * from './members';`, `export * from './invitations';`

2. **`schema/relations.ts`:**
   - Introduce `organizationsRelations`, mapping to `many(members)`, `many(projects)`, `many(tickets)`, etc.
   - Introduce `membersRelations` mapping to `one(organizations)` and `one(users)`.
   - Append the `organization` relationship to all tenant-level items (e.g., `ticketsRelations`, `activitiesRelations`, etc.).

### 4.7 Migrating User-Specific Org State to `members`

Currently, the `users` table holds fields like `department`, `status` (e.g., 'on-leave'), `skillTags`, `logStatus`, and `lastLogTime`. In a multi-tenant SaaS, a user might be a Developer ('active') in `Org A` but a Consultant ('inactive') in `Org B`. Thus, this state is inherently tenant-bound, not global.

We must modify the new `members` mapping table to absorb these fields:

```typescript
// Add these to schema/members.ts:
department: text('department'),
status: text('status', { enum: ['active', 'inactive', 'on-leave'] }).notNull().default('active'),
skillTags: jsonb('skill_tags').$type<string[]>(),
logStatus: text('log_status', { enum: ['green', 'yellow', 'red'] }).default('red'),
lastLogTime: timestamp('last_log_time'),
```

Simultaneously, we should delete these columns from `schema/users.ts` (and from `lib/auth.ts` additionalFields) to ensure a user's status is completely isolated per organization.

---

## 5. Authentication & Better-Auth Integration

We will wire up the `better-auth` system to use the new schema.

### 5.1 Configuring Output in `lib/auth.ts`

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      // Supply the new tables to the adapter:
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),
  plugins: [
    organization(), // Injects all API handlers under /api/auth/organization/*
  ],
  // Keep existing social providers and email/password configurations
});
```

### 5.2 Understanding Active Organization Management

When a user logs in, the authentication framework needs to know _which_ workspace they are currently viewing. `better-auth` attaches `activeOrganizationId` to the session.

- **Server-Side Fetch:**
  ```typescript
  const session = await auth.api.getSession({ headers: headers() });
  const currentOrgId = session?.session.activeOrganizationId;
  ```
- **Client-Side Switch:**
  The user can switch organizations via a dropdown UI component which triggers:
  ```typescript
  await authClient.organization.setActive({ organizationId: 'org_abc123' });
  ```
  This automatically updates the session cookie. A subsequent `window.location.reload()` or router refresh will present the new org data.

---

## 6. Identity, Access Management (IAM) & Roles

Multi-tenant architectural designs introduce a complex matrix of user roles. We must distinguish between Global Roles and Organization-Level Roles to prevent security flaws.

### 6.1 Global Roles (System Level)

Stored directly on the `users` table:

- **Global `admin`:** Has god-mode access across the entire SaaS platform. Can view all organizations, delete organizations from the backend, access global analytics, and manage global platform settings. Crucially, as requested by the original constraints: _Admins can only be created from the database directly._
- **Global `user` (Generalized):** All standard accounts created through the UI signup form will simply be users of the system lacking the global `admin` enum. Their permissions are entirely dictated by their Organization Roles. The concept of a generic "Member" at the global auth-screen level will merge into a unified generic "Login".

### 6.2 Organization Roles (Tenant Level)

Stored on the `members` table. These rules strictly apply _only_ when the user's `activeOrganizationId` matches the `organizationId` of the member record.

- **`owner`:** The user who created the organization. Can delete the organization, change the subscription plan, and promote other members to admins.
- **`admin`:** Can invite new users, manage project settings, view all tickets across all projects, and modify global label arrays.
- **`member`:** A standard developer. Can only interact with tickets assigned to them, log daily leaves, and update their personal breakthrough logs.

### 6.3 Enforcing Roles in Next.js Server Actions

Whenever accessing a protected route or executing a server action, we must enforce two layers of validation:

1. Does the user have an active session and active organization?
2. Does the user's role bridge the requirements of the action?

```typescript
// Example: actions/delete-project.ts
'use server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { members } from '@/db/schema/members';

export async function deleteProjectAction(projectId: string) {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session?.session.activeOrganizationId) {
    throw new Error('No active organization context found.');
  }

  // Authorize Org Role
  const member = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.organizationId, session.session.activeOrganizationId)
    ),
  });

  if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
    throw new Error('Insufficient privileges to delete a project.');
  }

  // Execute deletion ensuring cross-tenant safety!
  await db.delete(projects).where(
    and(
      eq(projects.id, projectId),
      eq(projects.organizationId, session.session.activeOrganizationId) // SECURITY CHECK
    )
  );
}
```

---

## 7. Organization Management Flow

Because Internode previously relied on a default "InternHub Central", we must build logic allowing users to create their own isolated domains.

### 7.1 Unified Authentication & Sign-Up Flow

The multi-tenant architecture demands a simplification of the initial entry point. We will deprecate the concept of signing up _as a member_ or _as an admin_ in favor of a **Unified Auth Flow**.

1. **A Single Unified Sign-Up/Log-In Form:** Users will navigate to a standard `/auth` or `/login` screen. They authenticate via Email/Password or OAuth (GitHub).
2. **Initial State (Orphaned User):** Upon successful signup, the user is authenticated in the system (`sessions` table), but they have zero rows in the `members` mapping table. They belong to _no organization_.
3. **The Onboarding Interceptor:** The Next.js middleware (or layout logic) detects an authenticated session with a `null` or empty `activeOrganizationId`. The user is immediately redirected and forcibly trapped in the `/onboarding` layout.
4. **User Choice Matrix during Onboarding:**
   - **Scenario A:** The user received an email invite prior to making an account. The system recognizes their email, and prompts: _"You have pending invites to Stark Industries. [Accept] or [Create New Workspace]"_.
   - **Scenario B:** The user is a raw new registration. The system prompts: _"Create your Organization Workspace"_.
5. **Organization Creation:** The user submits an organization name (e.g., "Acme Corp"). We call `authClient.organization.create({ name: 'Acme Corp', slug: 'acme-corp' })`.
6. **Automatic Promotion:** `better-auth` creates the `organizations` row AND automatically creates a `members` row setting this user as the `owner` of "Acme Corp".
7. **Redirection:** The user's active context is set to "Acme Corp", and they are admitted to the main dashboard.

### 7.2 Fetching Organization Data

All UI metrics, tickets, graphs, and projects must now receive the context of the active organization. You can no longer write `db.query.tickets.findMany()`.

**Standard Data Access Pattern:**

```typescript
// Fetching Tickets safely
export async function getTicketsForDashboard() {
  const session = await auth.api.getSession({ headers: headers() });
  const activeOrgId = session?.session.activeOrganizationId;

  if (!activeOrgId) return [];

  return await db.query.tickets.findMany({
    where: eq(tickets.organizationId, activeOrgId),
    with: { assignee: true, author: true },
  });
}
```

---

## 8. Invitation & Onboarding Flow

B2B multi-tenancy thrives on network effects—bringing team members into existing workspaces effortlessly and securely.

### 8.1 Generating the Invite & Email Dispatch Mechanism

1. An Organization Admin navigates to `/settings/team`.
2. They input target email(s) into a form and select a role (`admin` or `member`).
3. Form submission calls:
   ```typescript
   await authClient.organization.inviteMember({
     email: 'peter.parker@stark.com',
     role: 'member',
   });
   ```
4. **Token Generation:** `better-auth` cryptographically generates a secure invite token and persists it in the `invitations` table linked to the active `organizationId`.
5. **Email Dispatch Integration:** By default, `better-auth` provides hooks for email sending. We will configure the `sendMail` hook inside `lib/auth.ts` to integrate with Resend (or the chosen SMTP provider/AWS SES).
   ```typescript
   // Inside betterAuth config in lib/auth.ts
   emailAndPassword: {
     sendInvitationEmail: async ({ user, url, token, organization }) => {
       // We will build a template using react-email
       await resend.emails.send({
         from: 'team@internode.app',
         to: user.email,
         subject: `You have been invited to join ${organization.name} on Internode`,
         html: `<p>Click <a href="${url}">here</a> to join ${organization.name}.</p>`,
       });
     };
   }
   ```
6. The user receives an email containing a Magic Link: `https://internode.app/accept-invite?token=XYZ...`

### 8.2 Flow 1: Invitee Does Not Exist in System

1. External user clicks the link.
2. The `/accept-invite` page verifies the token's validity and expiry.
3. The system detects no user exists with the `peter.parker@stark.com` email address.
4. The user is presented with the Unified Sign-up Form, pre-filled with the invited email address. (Or they can click OAuth GitHub).
5. Post-signup, a successful redirect hook intercepts the flow, detects the `token` parameter, and invokes:
   ```typescript
   await authClient.organization.acceptInvite({ token: inviteToken });
   ```
6. The user is seamlessly added to the organization and directed to `/tasks/dashboard`.

### 8.3 Flow 2: Invitee Already Exists in System (Cross-Organization Membership)

This is a critical facet of B2B SaaS. A user (`freelancer@dev.com`) might already own their own workspace (`Freelancer LLC`) or be a member of another company.

1. User clicks the invite link in their email.
2. They log into their existing account (or are already logged in).
3. We present an Accept Invite confirmation screen: _"Stark Industries has invited you to join their workspace. You are currently logged in as freelancer@dev.com."_
4. Upon clicking "Accept", the system invokes `acceptInvite({ token })`.
5. A new `members` record is generated bridging `user.id` and `stark-industries-org.id`.
6. **Cross-Tenant State Management:** The user now exists in the `members` array for TWO distinct organizations. Both organizations remain completely cryptographically and logically isolated from one another.
7. The active session org is programmatically swapped to `Stark Industries` so they immediately see the workspace they just accepted. They can use the `<OrgSwitcher />` to navigate back to `Freelancer LLC` at any time without logging out.

### 8.4 Revoking & Expiry Policies

- Ensure invites have a strict `expiresAt` (e.g., 7 days or 168 hours).
- Give Organization Admins UI components to view "Pending Invites" and a button to explicitly update standard invite `status` to `canceled`.

---

## 9. Routing & UI Strategy

The URL structure is a major determinant of how multi-tenant apps are built. We must weigh the pros and cons.

### 9.1 Path-Based vs. State-Based Routing

**Approach A: State-Based (Recommended for Speed of Implementation)**

- URLs stay entirely flat: `/tasks/dashboard`, `/settings`, `/projects`.
- The user interface and server actions derive their context _entirely_ from the authentication session cookie (`session.activeOrganizationId`).
- We implement an "Organization Switcher" dropdown natively in the Navbar.
- Switching orgs mutates the cookie and triggers a hard reload (`window.location.reload()`) to refresh React Server Components.
- _Pros:_ Requires near-zero Next.js `app/` folder restructuring.
- _Cons:_ URLs cannot be shared contextually. If `User A` opens `/tasks/dashboard` and sends the link to `User B`, it opens `User B`'s current active org, which might be standard behavior anyway.

**Approach B: Path-Based (Deep-Linking Friendly)**

- URLs reflect the structure directly: `/app/[orgSlug]/dashboard`, `/app/[orgSlug]/settings`.
- _Pros:_ Highly shareable. Links inherently carry the organization context.
- _Cons:_ Requires shifting the entire Next.js file tree down a `[orgSlug]` dynamic directory. This forces every `layout.tsx` and `page.tsx` to handle `params.orgSlug`. Middleware becomes incredibly complex to validate if a user belongs to `orgSlug` on every request.

**Verdict:** We will pursue **State-Based Routing** leveraging the `better-auth` session. It provides rapid deployment speeds and maintains the current URL layout perfectly while retaining strict logic boundaries.

### 9.2 Essential New UI Components

1. **Global Organization Switcher (`<OrgSwitcher />`):**
   - Renders inside the Sidebar layout.
   - Fetches the list of organizations the user belongs to.
   - Updates `authClient.organization.setActive({ organizationId })`.
2. **Onboarding Screen Layout:**
   - A minimalist, distraction-free interface protecting the main app.
   - Input forms for "Organization Name".
3. **Admin Settings Navigation Panel:**
   - Extend the existing profile screens to accommodate "Organization Details", "Billing", "Team Members", and "Tags/Labels Management".

---

## 10. Data Migration Strategy

Internode is presumably operational with seeded demo data or active early users. We cannot simply drop tables. Transitioning the schema requires a surgical, zero-downtime approach.

### 10.1 Steps for Zero-Downtime Schema Migration

1. **Step 1: Soft Migration Array**
   - Update `schema/tickets.ts` (and all other domain tables) to include the `organizationId` foreign key, but configure it as `.references(() => organizations.id)` **WITHOUT `notNull()`**. Allow it to be temporarily nullable.
   - Run `bun run db:generate` then `bun run db:migrate` against production.

2. **Step 2: Initialize Core Seed Data**
   - Execute a Node.js CLI script against the database:
     ```typescript
     // Create the central baseline org.
     const [hqOrg] = await db
       .insert(organizations)
       .values({
         id: nanoid(),
         name: 'InternHub Central',
         slug: 'internhub-hq',
       })
       .returning();
     ```

3. **Step 3: Relational Backfilling**
   - Update all existing users and migrate their text field values to the mapping table.
   - Loop over all existing users:
     ```typescript
     await db.insert(members).values({
       organizationId: hqOrg.id,
       userId: user.id,
       role: user.role === 'admin' ? 'owner' : 'member',
     });
     ```
   - Run massive `UPDATE` queries to backfill business domains:
     ```sql
     UPDATE tickets SET organization_id = 'org_hq_id_here' WHERE organization_id IS NULL;
     UPDATE projects SET organization_id = 'org_hq_id_here' WHERE organization_id IS NULL;
     -- Repeat for all tables
     ```

4. **Step 4: Hard Constraint Enforcement**
   - Once the production database is 100% backfilled with no null `organizationId` values remaining, modify the Drizzle schemas to append `.notNull()` onto the `organizationId` declarations.
   - Generate a secondary subsequent schema migration.
   - Apply this to production, locking the data model permanently. At this point, the application is officially multi-tenant.

---

## 11. Detailed Implementation Roadmap

### Phase 1: Foundation (Database & Auth Config) - _Estimated 2-3 Days_

- Add `organizations`, `members`, and `invitations` schemas strictly aligning with better-auth specifications.
- Append `organizationId` columns to `tickets`, `projects`, `goals`, `breakthroughs`, `leaves`, `labels`, `activities`, `notifications`, `timeLogs`, `comments`, and `projectMembers`.
- Delete `organizationName` and `organizationDomain` from `users`.
- Setup `@better-auth/organization` plugin inside `lib/auth.ts`.
- Formulate and execute the 4-step Data Migration Strategy referenced above safely on staging/neon branch before production.

### Phase 2: Core Data Access Layer (DAL) Refactoring - _Estimated 3-4 Days_

- Hunt down every single `db.select()`, `db.query`, `db.insert()`, and `db.update()` across the Next.js `app/api`, Server Actions, and React hooks.
- Create helper functions: `requireActiveOrgSession()` inside API wrappers.
- Refactor all queries to append the strict `.where(eq(table.organizationId, activeOrgId))`. This is laborious but non-negotiable for security.
- Verify through manual verification that requests as two different users belonging to different organizations receive `HTTP 404` or `Empty Array` when trying to access each other's IDs.

### Phase 3: Organization Flows & Invitation System - _Estimated 2-3 Days_

- Construct the `/onboarding` layout and page.
- Build the "Team Settings" view in the Admin dashboard.
- Construct the interactive interface to list active members inside an org, with buttons to promote/demote roles.
- Implement the "Invite Member" modal utilizing `authClient.organization.inviteMember()`.
- Construct the `/invite` acceptance landing page, managing state between logged out users encountering a magic link and logged-in users taking the action.
- Write the Resend/Nodemailer backend triggers to dispatch clean, branded HTML invite emails.

### Phase 4: UI Refinement & Access Control

- Build global `<OrganizationSwitcher />` component.
- Refactor `Login.tsx` flow. Remove the artificial "Member" vs "Admin" mode toggle for standard logins. Implement a unified Single Login Form. If a user is a Global System Admin (created via database), the backend logic dynamically routes them to the System Admin panel. Standard users are routed through the Onboarding/Organization resolution pipeline.
- Implement RBAC (Role-Based Access Control) wrapper components. e.g., `<RequireRole role="admin">...<button>Delete</button>...</RequireRole>`.

---

## 12. Potential Complications & Mitigations

### 12.1 The Global Admin Paradox and Login Screen Refactoring

_Complication:_ The application originally had a split physical UI for "Member" vs "Admin".
_Mitigation:_ As analyzed in Phase 4, keeping this split UI is detrimental to a multi-tenant application where users can be a standard Member in Org A, but an Owner in Org B. The login screen should be completely agnostic. You authenticate an _identity_. Once authenticated, the server examines the user's roles. If `user.role === 'admin'` (the global system enum), they are presented with a button to enter the "System Operations Center". Otherwise, they are dropped into their `activeOrganizationId` context, where their permissions are entirely governed by the `members` mapping table. The actual code in `AuthContext` must verify global roles (`users.role === 'admin'`) for the Admin mode login, independently of `members.role`.

### 12.2 Cross-Tenant Data Leaks via Malicious ID Prediction

_Complication:_ If tickets use simple auto-incrementing integers or weak hashes, User A (Org A) might guess that Ticket `150` belongs to Org B and attempt an API fetch. If the backend fails to apply the `where` clause, data leaks.
_Mitigation:_

1. Continue utilizing UUIDs (`nanoid()`) for all primary keys (already standardized in Internode). It mitigates iteration attacks.
2. Abstract Drizzle queries. Create a `getServerDb(orgId)` higher-order function that inherently wraps all subsequent calls with `.where()` clauses, or explicitly enforce code reviews on server actions to verify isolation constraints.

### 12.3 Active Organization State Desynchronization

_Complication:_ A user is looking at `Project Alpha` in `Organization A` via multiple React tabs. In Tab 2, they use the Org Switcher to change to `Organization B` which mutates their active session cookie. Tab 1 is now in an orphaned visual state and any subsequent form submission might mistakenly attach `Project Alpha` data to `Organization B`.
_Mitigation:_ Next.js Server Actions validate the incoming parent entity IDs aggressively. If Tab 1 submits a Ticket creation tied to `Project Alpha`, the backend will look up `Project Alpha` and discover its `organizationId` is `Org A`, but the user's active session is `Org B`. The server must instantly throw a `Tenant Mismatch Boundary Error: 403 Forbidden` and force a client-side reload.

### 12.4 Project Membership Cross-Tenant Leaks

_Complication:_ The `project_members` mapping table binds a `userId` to a `projectId`. If an admin calls an API to add a user to a project, a malicious or buggy client could provide a `userId` of someone who exists in the global `users` table but does not belong to the project's `organizationId`.
_Mitigation:_ Before inserting a row into `project_members`, the backend MUST query the `members` table to verify that the target `userId` has an active membership record for the exact `organizationId` associated with the parent project.

---

## 13. Security Considerations

- **Strict Session Binding Check:** When executing destructive actions (DELETE, UPDATE), never assume the payload's `organizationId` is truthful. Always overwrite the payload utilizing the cryptographically signed `session.activeOrganizationId` derived directly from headers.
- **Cascading Deletes Risk:** The schemas map foreign keys utilizing `onDelete: 'cascade'`. Deleting an Organization will indiscriminately wipe all associated tickets, members, and projects. This is highly dangerous for enterprise billing. The architectural design strongly urges implementing "Soft Deletes" (an boolean column `isDeleted: boolean('is_deleted').default(false)`) for organizations, retaining the data for 30 days prior to a CRON job hard-purge.
- **Resource Limitations per Tenant:** Implement hard caps on total members and total projects tied to an organization to prevent a single abusive tenant from exhausting connection pools or hitting global rate limits, optionally reserving expansion vectors for future billing integration logic.

---

## 14. Code Snippet Appendices

#### Quick-Start `better-auth` Integration

```typescript
import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';

export const auth = betterAuth({
  database: {
    /* Your DB Configuration */
  },
  plugins: [
    organization({
      teams: {
        enabled: false, // We constrain hierarchy to purely Organizations, ignoring child-teams to reduce initial architectural complexity.
      },
      roles: {
        admin: ['project:create', 'project:delete', 'ticket:assign'],
        member: ['ticket:create', 'ticket:update'],
      }, // Optional Custom Permissions logic extending base roles.
    }),
  ],
});
```

#### Org Switcher Logic React Component Outline

```tsx
'use client';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export function OrganizationSwitcher() {
  const { data: orgs, isPending } = authClient.useListOrganizations();
  const { data: session } = authClient.useSession();
  const router = useRouter();

  if (isPending) return <Skeleton />;

  const handleSwitch = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId });
    router.refresh();
    // Fully evict client router cache guaranteeing clean state for new Org
  };

  return (
    <Select defaultValue={session?.session.activeOrganizationId} onValueChange={handleSwitch}>
      <SelectTrigger>
        <SelectValue placeholder="Select Organization" />
      </SelectTrigger>
      <SelectContent>
        {orgs?.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 16. Post-Deployment Audit Checklist

After successfully merging Phase 4 and migrating production:

1. [] Run an active session audit: Ensure no user has an `activeOrganizationId` that corresponds to an organization they do not have a `members` record for.
2. [] Validate DB connection pooling limits (Neon) haven't bottlenecked due to the additional `organizations` JOIN queries.
3. [] Review Vercel Edge Cache hit rates to ensure org-switcher cookies haven't bypassed necessary CDN caching on static assets.
4. [] Validate that Global System Admins can still access their overarching dashboard without being locked to a specific tenant.

## 17. Missing & Non-Functional UI Features

Based on the current audit of the codebase, the following UI components and logic pieces are either missing, non-functional, or require significant refactoring to align with the multi-tenant architecture.

### 17.1 Unified Identity-Based Login

- **Status:** Incorrect Implementation (`Login.tsx`).
- **Issue:** The current login screen uses a manual toggle between "Member" and "Admin".
- **Requirement:** A single, unified login form. The system should authenticate the user's identity first, then determine if they are a Global Admin (redirect to System Dash) or an Organization Member (redirect to active workspace).

### 17.2 Organization Switcher (`<OrgSwitcher />`)

- **Status:** Missing.
- **Issue:** There is no way for a user belonging to multiple organizations to switch their active context.
- **Requirement:** Integrate a dropdown in the `DashboardLayout` sidebar (as outlined in Appendix 14) that calls `setActive()` and refreshes the RSC tree.

### 17.3 Comprehensive Onboarding Flow

- **Status:** Basic/Placeholder (`app/tasks/onboarding/page.tsx`).
- **Issue:** The current onboarding only handles notification settings. It lacks the critical "Scenario B" (Create Organization) and "Scenario A" (Accept Pending Invite) logic.
- **Requirement:** Refactor the onboarding flow to force users into a workspace creation or selection state before granting access to the main dashboard.

### 17.4 Team Management & Invitations

- **Status:** Non-Functional / Legacy Logic (`app/tasks/members/page.tsx`).
- **Issue:** The "Invite Member" button is reported as non-functional. The logic relies on a custom `/api/invites` endpoint and the legacy `invites` table.
- **Requirement:**
  - Entirely replace the `/api/invites` logic with the `better-auth` organization plugin.
  - Update the "Members" view to fetch from the new `members` mapping table.
  - Ensure the "Pending Invites" list correctly reflects cryptographically signed tokens from `better-auth`.

### 17.5 Workspace Settings Refactoring

- **Status:** Legacy Implementation (`SettingsPage.tsx`).
- **Issue:** Settings currently update `organizationName` and `organizationDomain` on the flat `users` table.
- **Requirement:** Refactor the "Workspace Identity" tab to update the `organizations` table for the `activeOrganizationId`.

### 17.7 Accept Invite Confirmation Screen

- **Status:** Missing.
- **Issue:** When a user clicks an invite link, they need a dedicated page to confirm they want to join the organization, especially if they are already logged into a different account.
- **Requirement:** Build a `/accept-invite` landing page that validates the token and shows org metadata before joining.

### 17.8 Role Management & Member Actions

- **Status:** Missing.
- **Issue:** There is no dedicated UI to promote a member to admin or demote them, nor a way to revoke a pending invitation.
- **Requirement:** Add action menus (popups/modals) to the `MembersPage` for Organization Admins to manage their team effectively.

---
