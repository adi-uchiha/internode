---
trigger: always_on
---

When concluding a task and after completing your walkthrough, you must always execute the following steps:

1. Run the agent commit command which handles linting, building, and committing with strict checks:
   `bun run agent:commit "commit title" "optional description"`
2. If the command fails due to linting or build issues, resolve the issues and keep running it until it succeeds.

Example command:

```bash
bun run agent:commit "Refactor auth logic" "Extracted session handling to a separate hook and updated tests"
```

Whenever making changes to database schema you have to run the migration properly before concluding your changes.
bun run db:generate

## Multi-Tenant SaaS Architecture Reference

### Overview

The project uses a strict multi-tenant architecture where all data is isolated by `organizationId`. We use `Better Auth` with a custom Drizzle adapter for organization and member management.

### Organization-Scoped Access Control

The concept of a system-level "Admin" has been completely removed. Access control is now entirely based on the user's role within their active organization (`orgRole`).

- **Roles**: `owner`, `admin`, `member`.
- **Identity-First Login**: There is a single, unified login flow. Users log in once and are then scoped to an active organization.
- **Onboarding**: Users without an active organization are automatically redirected to the `/tasks/onboarding` flow to create or join an organization.

### Role Enforcement (AuthContext.tsx & lib/api-handler.ts)

- **Client-Side**: The `AuthContext` provides `orgRole` and `activeOrganizationId`. UI elements must be guarded using these values.
- **Server-Side**: The `withErrorHandler` wrapper in `lib/api-handler.ts` automatically extracts and validates `orgId` and the user's `role` from the session. Handlers receive `orgId` as part of the context.

### Terminology

ALWAYS use the term **Organization** instead of "Workspace" in UI, code, and communication.

### Environment & Config (lib/auth.ts)

- `baseURL` must be explicitly configured in the server `auth` config.
- `DATABASE_URL` in `.env` must not have trailing quotes.
- Migration to the multi-tenant model involved removing the `role` field from the `users` table. All roles are now stored in the `members` table.

IMPORANT DATABASE & MIGRATION CONTEXT
My vercerl build process (only have prod deployments) has the bun run db:migrate
But if we are making some breaking changes that reqires manual data migration. Please do the data migration on the prod db also. prod db url is there in the `scripts/reset-dbs.ts` So make sure you are migrating the prod data also.
And also the build process bun run db:migration (which runs only when I make a deployment) should also should not break. Which means do not run any db:push or db:migrate on the prod, which might break the build prcess command (bun run db:migrate).
