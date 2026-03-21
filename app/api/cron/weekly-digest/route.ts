import { NextResponse } from 'next/server';
import { db } from '@/db';
import { members, tickets, timeLogs, weeklyGoals } from '@/db/schema';
import { eq, and, gte, lt, count, sum } from 'drizzle-orm';
import { withCronAuth } from '@/lib/api-handler';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';
import { startOfWeek, endOfWeek, format } from 'date-fns';

/**
 * Cron: Weekly Digest
 *
 * For each active member across all organizations, computes the week's stats:
 *  - Tickets completed this week
 *  - Tickets in-progress
 *  - Hours logged
 *  - Goals completed / total
 *
 * Sends a personalized weekly summary email to each member who has
 * 'weeklyDigest' enabled in their notification preferences.
 *
 * Triggered every Sunday by .github/workflows/cron-weekly-digest.yml
 */
export const GET = withCronAuth(async () => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
  const weekLabel = `${format(weekStart, 'MMMM d')} – ${format(weekEnd, 'd, yyyy')}`;

  // Get all active members with their user + org info
  const allMembers = await db.query.members.findMany({
    where: eq(members.status, 'active'),
    with: {
      user: { columns: { id: true, email: true, name: true, notificationSettings: true } },
      organization: { columns: { id: true, name: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  const digestPromises = allMembers.map(async (member) => {
    if (!member.user || !member.organization) {
      skipped++;
      return;
    }

    const userId = member.userId;
    const orgId = member.organizationId;

    try {
      // Count tickets completed this week (assigned to user)
      const completedResult = await db
        .select({ count: count() })
        .from(tickets)
        .where(
          and(
            eq(tickets.organizationId, orgId),
            eq(tickets.assigneeId, userId),
            eq(tickets.status, 'done'),
            gte(tickets.updatedAt, weekStart),
            lt(tickets.updatedAt, weekEnd)
          )
        );
      const ticketsCompleted = completedResult[0]?.count ?? 0;

      // Count tickets in-progress assigned to user
      const inProgressResult = await db
        .select({ count: count() })
        .from(tickets)
        .where(
          and(
            eq(tickets.organizationId, orgId),
            eq(tickets.assigneeId, userId),
            eq(tickets.status, 'in-progress')
          )
        );
      const ticketsInProgress = inProgressResult[0]?.count ?? 0;

      // Sum hours logged this week by the user
      const hoursResult = await db
        .select({ total: sum(timeLogs.hours) })
        .from(timeLogs)
        .where(
          and(
            eq(timeLogs.organizationId, orgId),
            eq(timeLogs.userId, userId),
            gte(timeLogs.date, weekStart),
            lt(timeLogs.date, weekEnd)
          )
        );
      const hoursLogged = Number(hoursResult[0]?.total ?? 0);

      // Get this week's goals for the user
      const userGoal = await db.query.weeklyGoals.findFirst({
        where: and(
          eq(weeklyGoals.organizationId, orgId),
          eq(weeklyGoals.userId, userId),
          gte(weeklyGoals.weekStart, weekStart),
          lt(weeklyGoals.weekStart, weekEnd)
        ),
        with: { items: true },
      });

      const goalsTotal = userGoal?.items?.length ?? 0;
      const goalsCompleted = userGoal?.items?.filter((i) => i.completed).length ?? 0;

      await EmailService.weeklyDigest({
        recipientId: userId,
        recipientEmail: member.user.email,
        payload: {
          to: member.user.email,
          organizationName: member.organization.name,
          recipientName: member.user.name,
          weekLabel,
          ticketsCompleted,
          ticketsInProgress,
          hoursLogged: Math.round(hoursLogged * 10) / 10,
          goalsCompleted,
          goalsTotal,
          dashboardUrl: NEXT_PUBLIC_APP_URL,
        },
      });

      sent++;
    } catch (err) {
      console.error(`[cron:weekly-digest] Failed for user ${userId}:`, err);
      skipped++;
    }
  });

  await Promise.allSettled(digestPromises);

  console.log(`[cron:weekly-digest] Week: ${weekLabel}. Sent: ${sent}, Skipped: ${skipped}`);

  return NextResponse.json({
    success: true,
    week: weekLabel,
    sent,
    skipped,
  });
});
