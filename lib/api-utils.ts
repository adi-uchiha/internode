import { auth } from '@/lib/auth';
import { db } from '@/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers as nextHeaders } from 'next/headers';

/**
 * Resolves the active organization ID for a request.
 *
 * Priority:
 * 1. `session.activeOrganizationId` — set by better-auth when user calls
 *    `organization.setActive()`. This is the canonical, cryptographically-
 *    signed source of truth for multi-org users.
 * 2. DB fallback — first membership found for the user, used for single-org
 *    users or when the session cookie has not yet been written (e.g. right
 *    after first org creation before cookie refresh).
 *
 * Always prefers the session value so org-switching works correctly.
 */
export async function getActiveOrgId(userId: string): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await nextHeaders() });

  // Fast path: org is embedded in the session cookie
  if (session?.session.activeOrganizationId) {
    return session.session.activeOrganizationId;
  }

  // DB fallback: pick first membership (Phase 1 users assigned to InternHub HQ)
  const member = await db.query.members.findFirst({
    where: eq(members.userId, userId),
  });

  return member?.organizationId ?? null;
}
