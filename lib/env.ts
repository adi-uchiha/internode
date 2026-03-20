/**
 * Typesafe, required environment variable access.
 *
 * All vars here throw at import-time (server startup) if missing,
 * guaranteeing no silent runtime failures.
 */

function requireEnv(key: string): string {
  if (typeof window !== 'undefined') {
    // Return empty string on the client for private vars to avoid crash.
    // Public vars are handled separately below.
    return process.env[key] || '';
  }

  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: "${key}". ` + `Add it to your .env file.`
    );
  }
  return value;
}

// ─── Public Environment Variables ───────────────────────────────────────────
// These MUST be accessed via member notation (process.env.KEY) so that Next.js
// can statically embed them in the browser bundle.

export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
export const NEXT_PUBLIC_APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || '';
export const NEXT_PUBLIC_MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || '';

// Perform server-side validation for public variables
if (typeof window === 'undefined') {
  if (!NEXT_PUBLIC_APP_URL) {
    throw new Error('[env] Missing required environment variable: "NEXT_PUBLIC_APP_URL"');
  }
  if (!NEXT_PUBLIC_APP_NAME) {
    throw new Error('[env] Missing required environment variable: "NEXT_PUBLIC_APP_NAME"');
  }
}

// ─── Private Environment Variables (Server Only) ────────────────────────────
export const BETTER_AUTH_SECRET = requireEnv('BETTER_AUTH_SECRET');
export const BETTER_AUTH_URL = requireEnv('BETTER_AUTH_URL');
export const DATABASE_URL = requireEnv('DATABASE_URL');
export const GITHUB_CLIENT_ID = requireEnv('GITHUB_CLIENT_ID');
export const GITHUB_CLIENT_SECRET = requireEnv('GITHUB_CLIENT_SECRET');
export const SMTP_USER = requireEnv('SMTP_USER');
export const SMTP_PASSWORD = requireEnv('SMTP_PASSWORD');
export const RESEND_FROM_EMAIL = requireEnv('RESEND_FROM_EMAIL');
