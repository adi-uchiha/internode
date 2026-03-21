import { render } from '@react-email/render';
import { smtpClient } from './client';
import { RESEND_FROM_EMAIL, NEXT_PUBLIC_APP_URL } from '../env';
import { NotificationService } from '../notifications';
import { isEmailEnabled, filterEnabledRecipients } from './preferences';

// ─── Template Imports ────────────────────────────────────────────────────────
import { InvitationEmail } from '@/emails/InvitationEmail';
import { TicketAssignedEmail } from '@/emails/TicketAssignedEmail';
import { TicketStatusEmail } from '@/emails/TicketStatusEmail';
import { NewCommentEmail } from '@/emails/NewCommentEmail';
import { LeaveSubmittedEmail } from '@/emails/LeaveSubmittedEmail';
import { LeaveStatusEmail } from '@/emails/LeaveStatusEmail';
import { MemberJoinedEmail } from '@/emails/MemberJoinedEmail';
import { FeedbackProvidedEmail } from '@/emails/FeedbackProvidedEmail';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { OverdueTicketEmail } from '@/emails/OverdueTicketEmail';
import { WeeklyDigestEmail } from '@/emails/WeeklyDigestEmail';
import { TimeLoggedEmail } from '@/emails/TimeLoggedEmail';

// ─── Payload Type Imports ────────────────────────────────────────────────────
import type {
  InvitationEmailPayload,
  TicketAssignedPayload,
  TicketStatusChangedPayload,
  NewCommentPayload,
  LeaveSubmittedPayload,
  LeaveStatusPayload,
  MemberJoinedPayload,
  FeedbackProvidedPayload,
  WelcomeEmailPayload,
  OverdueTicketPayload,
  WeeklyDigestPayload,
  TimeLoggedPayload,
} from './types';

// ─── Shared Recipient Type ───────────────────────────────────────────────────

export interface EmailRecipient {
  userId: string;
  email: string;
  name: string;
}

// ─── Internal Dispatch ───────────────────────────────────────────────────────

/**
 * Core SMTP dispatch function. Renders the HTML and sends via emailjs client.
 *
 * Design:
 *  - NEVER throws. All SMTP errors are caught and logged.
 *  - Failures must never block or break the primary user action (DB write).
 *  - Context string is used for targeted log filtering.
 */
async function dispatch(opts: {
  to: string | string[];
  subject: string;
  html: string;
  /** Identifier for log lines, e.g. 'ticket-assigned' */
  context: string;
}): Promise<void> {
  try {
    const to = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;

    if (!to || to.trim() === '') {
      console.warn(`[EmailService:${opts.context}] Skipped — no recipients`);
      return;
    }

    await smtpClient.sendAsync({
      from: RESEND_FROM_EMAIL,
      to,
      subject: opts.subject,
      attachment: [{ data: opts.html, alternative: true }],
    });

    console.log(`[EmailService:${opts.context}] ✓ Sent to: ${to}`);
  } catch (err: unknown) {
    const error = err as Error;
    // Log everything but never surface to the caller
    console.error(`[EmailService:${opts.context}] ✗ SMTP FAILURE:`, {
      to: opts.to,
      subject: opts.subject,
      error: error.message,
      stack: error.stack,
    });
  }
}

// ─── EmailService ────────────────────────────────────────────────────────────

/**
 * The single dispatch hub for ALL transactional emails in Internode.
 *
 * Architecture:
 *  1. Route handlers call EmailService methods — not the SMTP client directly.
 *  2. Each method handles both the in-app notification (via NotificationService)
 *     AND the email dispatch, from a single call site.
 *  3. The `void` keyword at call sites makes every method fire-and-forget.
 *  4. User preferences are checked before sending (opt-in by default).
 *  5. SMTP failure never throws back to the caller.
 */
export const EmailService = {
  // ─── Invitation ─────────────────────────────────────────────────────────

  /**
   * Organization invitation — migrated from the inline call in lib/auth.ts.
   * Uses the existing InvitationEmail template unchanged.
   *
   * This is intentionally NOT gated by user preferences — invitations are
   * always transactional and must be delivered for the user to onboard.
   */
  async sendInvitation(params: {
    inviteeEmail: string;
    payload: InvitationEmailPayload;
  }): Promise<void> {
    const html = await render(InvitationEmail(params.payload));
    await dispatch({
      to: params.inviteeEmail,
      subject: `You've been invited to join ${params.payload.organizationName} on Internode`,
      html,
      context: 'invitation',
    });
  },

  // ─── Onboarding ──────────────────────────────────────────────────────────

  /**
   * Welcome email — fired in lib/auth.ts after a new user is created.
   * Not preference-gated (always sent once at account creation).
   */
  async welcome(params: { userEmail: string; payload: WelcomeEmailPayload }): Promise<void> {
    const html = await render(WelcomeEmail({ ...params.payload, baseUrl: NEXT_PUBLIC_APP_URL }));
    await dispatch({
      to: params.userEmail,
      subject: `Welcome to Internode, ${params.payload.userName}!`,
      html,
      context: 'welcome',
    });
  },

  // ─── Tickets ─────────────────────────────────────────────────────────────

  /**
   * Ticket Assigned — notifies the new assignee.
   *
   * Also creates the in-app notification so the bell updates.
   * Routes should call this INSTEAD of NotificationService.notifyAssignment.
   */
  async ticketAssigned(params: {
    organizationId: string;
    assigneeId: string;
    assigneeEmail: string;
    payload: TicketAssignedPayload;
  }): Promise<void> {
    // Always create in-app notification regardless of email preference
    await NotificationService.notifyAssignment({
      organizationId: params.organizationId,
      ticketId: params.payload.ticketShortId,
      ticketTitle: params.payload.ticketTitle,
      assigneeId: params.assigneeId,
      assignerName: params.payload.assignerName,
    });

    if (!(await isEmailEnabled(params.assigneeId, 'ticketAssigned'))) return;

    const html = await render(
      TicketAssignedEmail({ ...params.payload, baseUrl: NEXT_PUBLIC_APP_URL })
    );
    await dispatch({
      to: params.assigneeEmail,
      subject: `Assigned: [${params.payload.ticketShortId}] ${params.payload.ticketTitle}`,
      html,
      context: 'ticket-assigned',
    });
  },

  /**
   * Ticket Status Changed — notifies associated users (creator + assignee) except
   * the person who made the change.
   *
   * Routes should call this INSTEAD of NotificationService.notifyTicketEvent for status.
   */
  async ticketStatusChanged(params: {
    organizationId: string;
    ticketId: string;
    payload: TicketStatusChangedPayload;
    /** Users to potentially notify (creator, assignee, etc.) */
    recipients: EmailRecipient[];
    /** Do not create in-app or send email to this user (the actor) */
    excludeUserId: string;
  }): Promise<void> {
    const { organizationId, ticketId, excludeUserId, recipients, payload } = params;

    // In-app notification for all org members on the ticket
    await NotificationService.notifyTicketEvent({
      organizationId,
      ticketId,
      type: 'status',
      title: 'Status Updated',
      subtitle: `[${payload.ticketShortId}] Moved to ${payload.newStatus.toUpperCase()}`,
      excludeUserId,
    });

    // Email — check preference for each non-excluded recipient
    const eligibleRecipients = recipients.filter((r) => r.userId !== excludeUserId);
    if (eligibleRecipients.length === 0) return;

    const enabledUserIds = await filterEnabledRecipients(
      eligibleRecipients.map((r) => r.userId),
      'ticketStatusChanged'
    );

    for (const recipient of eligibleRecipients.filter((r) => enabledUserIds.includes(r.userId))) {
      const html = await render(
        TicketStatusEmail({
          ...payload,
          recipientName: recipient.name,
          baseUrl: NEXT_PUBLIC_APP_URL,
        })
      );
      await dispatch({
        to: recipient.email,
        subject: `[${payload.ticketShortId}] Status changed to ${payload.newStatus}`,
        html,
        context: 'ticket-status-changed',
      });
    }
  },

  /**
   * New Comment — notifies ticket creator and assignee.
   *
   * Routes should call this INSTEAD of NotificationService.notifyTicketEvent for comments.
   */
  async newComment(params: {
    organizationId: string;
    ticketId: string;
    payload: NewCommentPayload;
    recipients: EmailRecipient[];
    excludeUserId: string;
  }): Promise<void> {
    const { organizationId, ticketId, excludeUserId, recipients, payload } = params;

    await NotificationService.notifyTicketEvent({
      organizationId,
      ticketId,
      type: 'comment',
      title: 'New Comment',
      subtitle: `[${payload.ticketShortId}] ${payload.commenterName}: ${payload.commentSnippet.slice(0, 60)}`,
      excludeUserId,
    });

    const eligibleRecipients = recipients.filter((r) => r.userId !== excludeUserId);
    if (eligibleRecipients.length === 0) return;

    const enabledUserIds = await filterEnabledRecipients(
      eligibleRecipients.map((r) => r.userId),
      'newComment'
    );

    for (const recipient of eligibleRecipients.filter((r) => enabledUserIds.includes(r.userId))) {
      const html = await render(
        NewCommentEmail({ ...payload, recipientName: recipient.name, baseUrl: NEXT_PUBLIC_APP_URL })
      );
      await dispatch({
        to: recipient.email,
        subject: `New comment on [${payload.ticketShortId}] ${payload.ticketTitle}`,
        html,
        context: 'new-comment',
      });
    }
  },

  /**
   * Overdue Ticket — fired by the daily cron job for each overdue ticket.
   */
  async overdueTicket(params: {
    assigneeId: string;
    assigneeEmail: string;
    payload: OverdueTicketPayload;
  }): Promise<void> {
    if (!(await isEmailEnabled(params.assigneeId, 'overdueReminder'))) return;

    const html = await render(
      OverdueTicketEmail({ ...params.payload, baseUrl: NEXT_PUBLIC_APP_URL })
    );
    await dispatch({
      to: params.assigneeEmail,
      subject: `Overdue: [${params.payload.ticketShortId}] ${params.payload.ticketTitle}`,
      html,
      context: 'overdue-ticket',
    });
  },

  // ─── Leaves ──────────────────────────────────────────────────────────────

  /**
   * Leave Submitted — notifies all org admins/owners about a new leave request.
   * Also creates in-app notification for each admin.
   */
  async leaveSubmitted(params: {
    organizationId: string;
    adminRecipients: EmailRecipient[];
    payload: LeaveSubmittedPayload;
  }): Promise<void> {
    const { organizationId, adminRecipients, payload } = params;

    // In-app notification to all admins
    for (const admin of adminRecipients) {
      await NotificationService.create({
        organizationId,
        userId: admin.userId,
        type: 'leave-requested',
        title: 'New Leave Request',
        subtitle: `${payload.requesterName} requested ${payload.leaveType} leave`,
      });
    }

    if (adminRecipients.length === 0) return;

    const enabledUserIds = await filterEnabledRecipients(
      adminRecipients.map((a) => a.userId),
      'leaveSubmitted'
    );

    for (const admin of adminRecipients.filter((a) => enabledUserIds.includes(a.userId))) {
      const html = await render(
        LeaveSubmittedEmail({ ...payload, adminName: admin.name, baseUrl: NEXT_PUBLIC_APP_URL })
      );
      await dispatch({
        to: admin.email,
        subject: `Leave Request: ${payload.requesterName} — ${payload.leaveType}`,
        html,
        context: 'leave-submitted',
      });
    }
  },

  /**
   * Leave Status Changed (approved / rejected) — notifies the requester.
   */
  async leaveStatusChanged(params: {
    organizationId: string;
    requesterId: string;
    requesterEmail: string;
    payload: LeaveStatusPayload;
  }): Promise<void> {
    const { organizationId, requesterId, requesterEmail, payload } = params;
    const statusLabel = payload.status === 'approved' ? 'Approved' : 'Declined';

    // In-app notification always fires
    await NotificationService.create({
      organizationId,
      userId: requesterId,
      type: 'leave-status',
      title: `Leave ${statusLabel}`,
      subtitle: `Your ${payload.leaveType} leave request has been ${payload.status}`,
    });

    if (!(await isEmailEnabled(requesterId, 'leaveStatus'))) return;

    const html = await render(LeaveStatusEmail({ ...payload, baseUrl: NEXT_PUBLIC_APP_URL }));
    await dispatch({
      to: requesterEmail,
      subject: `Your leave request has been ${payload.status}`,
      html,
      context: `leave-${payload.status}`,
    });
  },

  // ─── Team / Organization ─────────────────────────────────────────────────

  /**
   * Member Joined — notifies all org admins when an invitation is accepted.
   *
   * NOTE: In-app notifications are already handled by the
   * /api/events/member-joined route. This method only adds the email layer.
   */
  async memberJoined(params: {
    adminRecipients: EmailRecipient[];
    payload: MemberJoinedPayload;
  }): Promise<void> {
    const { adminRecipients, payload } = params;
    if (adminRecipients.length === 0) return;

    const enabledUserIds = await filterEnabledRecipients(
      adminRecipients.map((a) => a.userId),
      'memberJoined'
    );

    for (const admin of adminRecipients.filter((a) => enabledUserIds.includes(a.userId))) {
      const html = await render(
        MemberJoinedEmail({ ...payload, adminName: admin.name, baseUrl: NEXT_PUBLIC_APP_URL })
      );
      await dispatch({
        to: admin.email,
        subject: `${payload.newMemberName} has joined ${payload.organizationName}`,
        html,
        context: 'member-joined',
      });
    }
  },

  // ─── Time Logs ──────────────────────────────────────────────────────────

  /**
   * Time Logged — notifies org owners/admins when a member logs time.
   *
   * Only sends to recipients who have the 'timeLogged' preference enabled.
   */
  async timeLogged(params: {
    recipients: EmailRecipient[];
    payload: TimeLoggedPayload;
  }): Promise<void> {
    const { recipients, payload } = params;

    if (recipients.length === 0) return;

    const enabledUserIds = await filterEnabledRecipients(
      recipients.map((r) => r.userId),
      'timeLogged'
    );

    for (const admin of recipients.filter((r) => enabledUserIds.includes(r.userId))) {
      const html = await render(
        TimeLoggedEmail({ ...payload, recipientName: admin.name, baseUrl: NEXT_PUBLIC_APP_URL })
      );
      await dispatch({
        to: admin.email,
        subject: `[${payload.ticketShortId}] ${payload.loggerName} logged ${payload.hours}h`,
        html,
        context: 'time-logged',
      });
    }
  },

  // ─── Feedback ────────────────────────────────────────────────────────────

  /**
   * Feedback Provided — admin left a comment on a time log or breakthrough.
   * Notifies the record owner in-app and via email.
   */
  async feedbackProvided(params: {
    organizationId: string;
    recipientId: string;
    recipientEmail: string;
    payload: FeedbackProvidedPayload;
  }): Promise<void> {
    const { organizationId, recipientId, recipientEmail, payload } = params;

    await NotificationService.create({
      organizationId,
      userId: recipientId,
      type: 'breakthrough',
      title: 'Feedback Received',
      subtitle: `${payload.adminName} left feedback on your ${payload.itemType === 'time-log' ? 'time log' : 'breakthrough'}`,
    });

    if (!(await isEmailEnabled(recipientId, 'feedbackProvided'))) return;

    const html = await render(FeedbackProvidedEmail({ ...payload, baseUrl: NEXT_PUBLIC_APP_URL }));
    await dispatch({
      to: recipientEmail,
      subject: `${payload.adminName} left feedback on your ${payload.itemType === 'time-log' ? 'time log' : 'breakthrough'}`,
      html,
      context: 'feedback-provided',
    });
  },

  // ─── Weekly Digest ───────────────────────────────────────────────────────

  /**
   * Weekly Digest — fired by the Sunday cron job per active member.
   */
  async weeklyDigest(params: {
    recipientId: string;
    recipientEmail: string;
    payload: WeeklyDigestPayload;
  }): Promise<void> {
    if (!(await isEmailEnabled(params.recipientId, 'weeklyDigest'))) return;

    const html = await render(
      WeeklyDigestEmail({ ...params.payload, baseUrl: NEXT_PUBLIC_APP_URL })
    );
    await dispatch({
      to: params.recipientEmail,
      subject: `Your Internode weekly summary — ${params.payload.weekLabel}`,
      html,
      context: 'weekly-digest',
    });
  },
};
