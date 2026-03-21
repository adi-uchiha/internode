import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * The full set of toggleable email notification type keys.
 * These map directly to notificationSettings.email.<key> in the users table.
 *
 * Adding a new email type: add the key here, add a toggle to the preferences UI,
 * and call isEmailEnabled() in your new EmailService method.
 */
export type EmailPreferenceKey =
  | 'ticketAssigned'
  | 'ticketStatusChanged'
  | 'newComment'
  | 'leaveStatus'
  | 'leaveSubmitted'
  | 'memberJoined'
  | 'feedbackProvided'
  | 'timeLogged'
  | 'overdueReminder'
  | 'weeklyDigest';

/**
 * Checks whether a specific user has opted into a given email notification type.
 *
 * Returns `true` by default when:
 *  - The user does not exist in the DB
 *  - notificationSettings is null
 *  - The key is not explicitly set in the settings
 *
 * Only returns `false` when the key is explicitly set to `false`.
 */
export async function isEmailEnabled(userId: string, key: EmailPreferenceKey): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { notificationSettings: true },
  });

  const emailPrefs = user?.notificationSettings?.email;
  if (!emailPrefs) return true; // opt-in by default

  return emailPrefs[key] !== false;
}

/**
 * Batch preference check for multiple users.
 * Returns only the subset of user IDs for which the given email key is enabled.
 *
 * Uses a single DB query for efficiency — safe to call with large arrays.
 */
export async function filterEnabledRecipients(
  userIds: string[],
  key: EmailPreferenceKey
): Promise<string[]> {
  if (userIds.length === 0) return [];

  const rows = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: { id: true, notificationSettings: true },
  });

  return rows
    .filter((u) => {
      const emailPrefs = u.notificationSettings?.email;
      if (!emailPrefs) return true;
      return emailPrefs[key] !== false;
    })
    .map((u) => u.id);
}
