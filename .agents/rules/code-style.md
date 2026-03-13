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

## Authentication & Signup Flow Reference

### Overview

The project uses `Better Auth` for session management with a custom Drizzle adapter for PostgreSQL (Neon).

### Dual Login Modes (Login.tsx)

The login screen features two modes: **Member** and **Admin**.

- **Member**: Accesses the "Developer Portal". Primarily uses GitHub Social Sign-in. Email/Password form visibility is controlled by `AUTH_FLAGS.ENABLE_EMAIL_SIGNUP`.
- **Admin**: Accesses the "Admin Dashboard". **Only** supports Email/Password login. GitHub sign-in is hidden for security.

### Role Enforcement (AuthContext.tsx)

The `login` function in `AuthContext` is responsible for cross-checking roles:

- It accepts a `requiredRole` argument.
- After successful `signIn.email`, it fetches the session and checks if the user's role matches `requiredRole`.
- If the role does not match, the user is automatically logged out and notified of invalid credentials.

ADMIN CAN ONLY BE CREATED FROM DATABASE BY CHANGING ROLE DIRECTLY FROM DATABASE. There is no option in project to create admin. This is a enforcement.

### Signup Logic (Login.tsx & AuthContext.tsx)

To ensure a seamless onboarding experience for members:

- Explicit **Log In** and **Sign Up** buttons are provided for Members when `AUTH_FLAGS.ENABLE_EMAIL_SIGNUP` is enabled.
- The **Sign Up** button triggers `signUp.email` using the email as a credential and the email prefix as a default `name`.
- **Admins** only have a **Log In** button. Signup is never allowed for admins.
- If the feature flag is OFF, the email/password form is hidden for members, leaving only GitHub login.

### Environment & Config (lib/auth.ts)

- `baseURL` must be explicitly configured in the server `auth` config to prevent `ERR_INVALID_URL` errors during social sign-ins.
- `DATABASE_URL` in `.env` must not have trailing quotes.
- `role` field in `users` table defaults to `member`.

IMPORANT DATABASE & MIGRATION CONTEXT
My vercerl build process (only have prod deployments) has the bun run db:migrate
But if we are making some breaking changes that reqires manual data migration. Please do the data migration on the prod db also. prod db url is there in the `scripts/reset-dbs.ts` So make sure you are migrating the prod data also.
And also the build process bun run db:migration (which runs only when I make a deployment) should also should not break. Which means do not run any db:push or db:migrate on the prod, which might break the build prcess command (bun run db:migrate).
