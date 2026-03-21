import { db } from '@/db';
import { notifications, tickets } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';

export type NotificationType =
  | 'assigned'
  | 'overdue'
  | 'status'
  | 'time-logged'
  | 'comment'
  | 'member-joined'
  | 'leave-requested'
  | 'leave-status'
  | 'breakthrough';

export interface CreateNotificationParams {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  ticketId?: string;
}

export class NotificationService {
  /**
   * Creates a new notification for a user.
   * Includes basic deduplication to avoid spamming for the same event.
   */
  static async create(params: CreateNotificationParams) {
    const { organizationId, userId, type, title, subtitle, ticketId } = params;

    // Optional: Avoid sending notifications to the user who triggered the action
    // This should be handled by the caller by checking session.user.id

    try {
      const [newNotification] = await db
        .insert(notifications)
        .values({
          id: nanoid(),
          organizationId,
          userId,
          type,
          ticketId: ticketId || null,
          title,
          subtitle: subtitle || null,
          read: false,
          createdAt: new Date(),
        })
        .returning();

      return newNotification;
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error);
      // We don't want to break the main flow if notification fails
      return null;
    }
  }

  /**
   * Notify a ticket's relevant users (owner/assignee) about an event.
   */
  static async notifyTicketEvent(params: {
    organizationId: string;
    ticketId: string;
    type: NotificationType;
    title: string;
    subtitle: string;
    excludeUserId?: string;
  }) {
    const { organizationId, ticketId, type, title, subtitle, excludeUserId } = params;

    const ticket = await db.query.tickets.findFirst({
      where: and(eq(tickets.id, ticketId), eq(tickets.organizationId, organizationId)),
    });

    if (!ticket) return;

    const userIdsToNotify = new Set<string>();
    if (ticket.createdById) userIdsToNotify.add(ticket.createdById);
    if (ticket.assigneeId) userIdsToNotify.add(ticket.assigneeId);

    // Remove the user who triggered the event
    if (excludeUserId) {
      userIdsToNotify.delete(excludeUserId);
    }

    const notificationPromises = Array.from(userIdsToNotify).map((userId) =>
      this.create({
        organizationId,
        userId,
        type,
        title,
        subtitle,
        ticketId,
      })
    );

    await Promise.all(notificationPromises);
  }

  /**
   * Specifically for ticket assignment.
   */
  static async notifyAssignment(params: {
    organizationId: string;
    ticketId: string;
    ticketTitle: string;
    assigneeId: string;
    assignerName: string;
  }) {
    const { organizationId, ticketId, ticketTitle, assigneeId, assignerName } = params;

    await this.create({
      organizationId,
      userId: assigneeId,
      type: 'assigned',
      title: 'New Task Assigned',
      subtitle: `${assignerName} assigned you to "${ticketTitle}"`,
      ticketId,
    });
  }
}
