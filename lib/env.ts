/**
 * Typesafe, required environment variable access.
 *
 * All vars here throw at import-time (server startup) if missing,
 * guaranteeing no silent runtime failures.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: "${key}". ` + `Add it to your .env file.`
    );
  }
  return value;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const BETTER_AUTH_SECRET = requireEnv('BETTER_AUTH_SECRET');
export const BETTER_AUTH_URL = requireEnv('BETTER_AUTH_URL');
export const NEXT_PUBLIC_APP_URL = requireEnv('NEXT_PUBLIC_APP_URL');
export const NEXT_PUBLIC_APP_NAME = requireEnv('NEXT_PUBLIC_APP_NAME');

// ─── Database ────────────────────────────────────────────────────────────────
export const DATABASE_URL = requireEnv('DATABASE_URL');

// ─── GitHub OAuth ────────────────────────────────────────────────────────────
export const GITHUB_CLIENT_ID = requireEnv('GITHUB_CLIENT_ID');
export const GITHUB_CLIENT_SECRET = requireEnv('GITHUB_CLIENT_SECRET');

// ─── Email / SMTP ────────────────────────────────────────────────────────────
export const SMTP_USER = requireEnv('SMTP_USER');
export const SMTP_PASSWORD = requireEnv('SMTP_PASSWORD');
export const RESEND_FROM_EMAIL = requireEnv('RESEND_FROM_EMAIL');
