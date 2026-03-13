import { db } from '@/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Gets the primary organization ID for a user.
 * In Phase 1, this returns the first organization the user is a member of.
 */
export async function getActiveOrgId(userId: string): Promise<string | null> {
  const member = await db.query.members.findFirst({
    where: eq(members.userId, userId),
  });
  return member?.organizationId || null;
}
