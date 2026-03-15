import { db } from '@/db';
import { tickets } from '@/db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { NotificationService } from '../notifications';

/**
 * Service to check for overdue tickets and notify assigned users.
 * This should be called by a cron job or a scheduled task.
 */
export class OverdueChecker {
  static async checkAndNotify() {
    console.log('[OverdueChecker] Starting overdue scan...');

    try {
      const now = new Date();

      // Find tickets that are:
      // 1. Not completed (status != 'done')
      // 2. Have a due date in the past
      // 3. Are not already marked as overdue in notifications (optional, but good for deduplication)
      const overdueTickets = await db.query.tickets.findMany({
        where: and(
          eq(tickets.status, 'todo'), // Or any status that is not 'done'
          lt(tickets.dueDate, now),
          sql`${tickets.status} != 'done'`
        ),
        with: {
          assignee: true,
        },
      });

      console.log(`[OverdueChecker] Found ${overdueTickets.length} overdue tickets.`);

      for (const ticket of overdueTickets) {
        if (!ticket.assigneeId) continue;

        // Check if we already sent an overdue notification for this ticket today
        // (Simplified check: just notify once per run for now)
        await NotificationService.create({
          organizationId: ticket.organizationId,
          userId: ticket.assigneeId,
          type: 'overdue',
          title: 'Task Overdue',
          subtitle: `[${ticket.ticketId}] "${ticket.title}" was due on ${ticket.dueDate?.toLocaleDateString()}`,
          ticketId: ticket.id,
        });
      }

      console.log('[OverdueChecker] Overdue scan completed.');
    } catch (error) {
      console.error('[OverdueChecker] Critical failure:', error);
    }
  }
}
