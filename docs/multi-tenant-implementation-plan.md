# Multi-Tenant Phase-Wise Implementation Plan

This document provides a surgical, step-by-step roadmap for implementing the multi-tenant architecture outlined in [multi-tenant-architecture.md](./multi-tenant-architecture.md).

> [!IMPORTANT]
> This plan assumes you have Resend (or an SMTP provider) configured for email invitations and that the `Better-Auth` package is already installed.

## Phase 1: Foundation & Data Migration

**Goal:** Establish the new schema and migrate existing data to the central organization.

- **Tasks:**
  1. **Schema Definition:** Create `schema/organizations.ts`, `schema/members.ts`, and `schema/invitations.ts`. (Ref: [Section 4.2](./multi-tenant-architecture.md#42-new-tables-provided-by-better-auth-org-plugin))
  2. **Schema Refactoring:** Add `organizationId` to all tenant-level tables (tickets, projects, etc.) as nullable fields temporarily. (Ref: [Section 4.3](./multi-tenant-architecture.md#43-modifying-existing-tenant-level-tables))
  3. **Auth Configuration:** Integrate the `organization()` plugin in `lib/auth.ts`. (Ref: [Section 5.1](./multi-tenant-architecture.md#51-configuring-output-in-libauth-ts))
  4. **Baseline Org Seed:** Execute a script to create "InternHub Central" as the default HQ organization. (Ref: [Section 10.1 Step 2](./multi-tenant-architecture.md#101-steps-for-zero-downtime-schema-migration))
  5. **Data Backfilling:** Migrate all existing users into the `members` table and assign all current tickets/projects to the HQ organization. (Ref: [Section 10.1 Step 3](./multi-tenant-architecture.md#101-steps-for-zero-downtime-schema-migration))
  6. **Enforce Constraints:** Once backfilled, update columns to `notNull()` and apply final migrations. (Ref: [Section 10.1 Step 4](./multi-tenant-architecture.md#101-steps-for-zero-downtime-schema-migration))

- **Success Criteria:**
  - `better-auth` tables are synchronized.
  - All existing data is logically bound to the "InternHub Central" ID.

---

## Phase 2: Identity & Onboarding Flow

**Goal:** Implement a unified entry point and force users into a workspace context.

- **Tasks:**
  1. **Unified Login:** Refactor `Login.tsx` to remove the Member/Admin toggle. Implement a single form that routes users based on their session state. (Ref: [Section 17.1](./multi-tenant-architecture.md#171-unified-identity-based-login))
  2. **Onboarding Interceptor:** Update the onboarding layout to detect "Orphaned Users" (no org membership) and trap them in the onboarding flow. (Ref: [Section 7.1](./multi-tenant-architecture.md#71-unified-authentication--sign-up-flow))
  3. **Workspace Creation:** Build the "Create Your Organization" step in onboarding. (Ref: [Section 7.1 Task 5](./multi-tenant-architecture.md#71-unified-authentication--sign-up-flow))
  4. **Default Org Setup:** Ensure new organization owners are automatically assigned the `owner` role in the `members` table. (Ref: [Section 6.2](./multi-tenant-architecture.md#62-organization-roles-tenant-level))

- **Success Criteria:**
  - New users are forced to create a workspace.
  - Verify that `proxy.ts` correctly handles session redirects.

---

## Phase 3: Team Management & Invitations

**Goal:** Enable secure member invitations and organization-level RBAC.

- **Tasks:**
  1. **Better-Auth Invites:** Entirely replace `/api/invites` with the `better-auth` invitation API. (Ref: [Section 8.1](./multi-tenant-architecture.md#81-generating-the-invite--email-dispatch-mechanism))
  2. **Email Templates:** Build and configure React-Email templates for invitations. The email template theme should match the project theme (ref: /home/aditya/proj/internode/docs/style.md, /home/aditya/proj/internode/docs/landing-page.md). (Ref: [Section 8.1 Task 5](./multi-tenant-architecture.md#81-generating-the-invite--email-dispatch-mechanism))
  3. **Acceptance Landing Page:** Create `/accept-invite` to handle magic link tokens and confirm user acceptance. (Ref: [Section 17.7](./multi-tenant-architecture.md#177-accept-invite-confirmation-screen))
  4. **Members Page Refactor:** Update `MembersPage` to show pending invites and manage active member roles (Promote/Demote/Remove). (Ref: [Section 17.4](./multi-tenant-architecture.md#174-team-management--invitations))

- **Success Criteria:**
  - Magic links successfully add users to the `members` table with correct roles.
  - Organization Admins can see and revoke pending invites.

---

## Phase 4: Data Access Layer (DAL) Refactoring

**Goal:** Secure the application against cross-tenant data leaks.

- **Tasks:**
  1. **Query Filtering:** Systematically update every `db.query` or `db.select` call to include `.where(eq(table.organizationId, activeOrgId))`. (Ref: [Section 7.2](./multi-tenant-architecture.md#72-fetching-organization-data))
  2. **Server Action Security:** Enforce server-side session checks in all actions to ensure the user belongs to the target organization they are modifying. (Ref: [Section 6.3](./multi-tenant-architecture.md#63-enforcing-roles-in-nextjs-server-actions))
  3. **Relation Mapping:** Update `relations.ts` to include organization-to-entity mappings for all business domains. (Ref: [Section 4.6](./multi-tenant-architecture.md#46-modifying-schema-index--relations-indexts--relationsts))

- **Success Criteria:**
  - No database query returns data from another organization.
  - Manual URL manipulation to a different organization ID results in 403/404.

---

## Phase 5: UI Refinement & Switcher

**Goal:** Provide full workspace visibility and context switching.

- **Tasks:**
  1. **Organization Switcher:** Implement `<OrgSwitcher />` in the sidebar allowing users to call `setActive()`. (Ref: [Section 17.2](./multi-tenant-architecture.md#172-organization-switcher-orgswitcher-))
  2. **Settings Refactor:** Move workspace identity settings to update the `organizations` table instead of the global `users` table. (Ref: [Section 17.5](./multi-tenant-architecture.md#175-workspace-settings-refactoring))
  3. **RBAC Component:** Build the `<RequireRole />` wrapper to toggle visibility of UI elements (like "Delete Project") based on org-level roles. (Ref: [Section 17.6](./multi-tenant-architecture.md#176-role-based-visibility-ui-trim))

- **Success Criteria:**
  - Users can switch between workspaces without re-authenticating.
  - The UI accurately reflects the user's role in the _active_ workspace.

---

## Phase 6: Final Verification & Audit

**Goal:** Final manual verification of data isolation and system health.

- **Tasks:**
  1. **Manual Isolation Check:** Confirm that `Org A` cannot query `Org B` data by manually switching contexts and attempting to access restricted IDs.
  2. **Session Audit:** Audit production sessions to ensure all users are correctly assigned as members of at least one org. (Ref: [Section 16.1](./multi-tenant-architecture.md#16-post-deployment-audit-checklist))
  3. **Global Admin Check:** Verify that users with the global `admin` role can still bypass organization boundaries for system-wide auditing. (Ref: [Section 6.1](./multi-tenant-architecture.md#61-global-roles-system-level))

- **Success Criteria:**
  - Codebase passes all manual security checks for tenant isolation.
  - Application performs within expected latency limits on Neon.
