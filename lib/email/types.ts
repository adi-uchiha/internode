/**
 * Strongly-typed payload interfaces for every email notification event.
 *
 * This is the single source of truth for the contract between route handlers
 * and the EmailService. All templates props must derive from these interfaces.
 */

/**
 * Base fields required by every email dispatch call.
 * `to` accepts a single address or an array for multi-recipient emails (e.g. all admins).
 */
export interface BaseEmailPayload {
  to: string | string[];
  organizationName: string;
}

// ─── Invitation ────────────────────────────────────────────────────────────

/**
 * Invitation email — mirrors InvitationEmail.tsx props exactly.
 * Declared here so it is managed within the typed payload ecosystem.
 */
export interface InvitationEmailPayload extends BaseEmailPayload {
  inviterName: string;
  inviterEmail: string;
  role: string;
  acceptUrl: string;
  expiresInDays?: number;
  baseUrl: string;
}

// ─── Tickets ───────────────────────────────────────────────────────────────

export interface TicketAssignedPayload extends BaseEmailPayload {
  assigneeName: string;
  assignerName: string;
  /** Short human-readable ticket ID e.g. "VELO-12" */
  ticketShortId: string;
  ticketId: string;
  ticketTitle: string;
  ticketUrl: string;
}

export interface TicketStatusChangedPayload extends BaseEmailPayload {
  recipientName: string;
  ticketShortId: string;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  changedByName: string;
  ticketUrl: string;
}

export interface NewCommentPayload extends BaseEmailPayload {
  recipientName: string;
  commenterName: string;
  ticketShortId: string;
  ticketTitle: string;
  /** First 200 characters of the comment */
  commentSnippet: string;
  ticketUrl: string;
}

export interface OverdueTicketPayload extends BaseEmailPayload {
  assigneeName: string;
  ticketShortId: string;
  ticketTitle: string;
  /** Human-readable formatted date, e.g. "March 15, 2026" */
  dueDate: string;
  ticketUrl: string;
}

export interface TimeLoggedPayload extends BaseEmailPayload {
  recipientName: string;
  loggerName: string;
  ticketShortId: string;
  ticketTitle: string;
  hours: number;
  note: string;
  dashboardUrl: string;
}

// ─── Leaves ────────────────────────────────────────────────────────────────

export interface LeaveSubmittedPayload extends BaseEmailPayload {
  /** Name of the admin receiving this notification */
  adminName: string;
  requesterName: string;
  leaveType: string;
  leaveDate: string;
  reason?: string;
  /** Link to the admin leave management page */
  dashboardUrl: string;
}

export interface LeaveStatusPayload extends BaseEmailPayload {
  requesterName: string;
  leaveType: string;
  leaveDate: string;
  status: 'approved' | 'rejected';
  /** The admin/manager who made the decision */
  reviewerName: string;
  reason?: string;
  dashboardUrl: string;
}

// ─── Team & Organization ───────────────────────────────────────────────────

export interface MemberJoinedPayload extends BaseEmailPayload {
  adminName: string;
  newMemberName: string;
  newMemberEmail: string;
  membersUrl: string;
}

// ─── Feedback ──────────────────────────────────────────────────────────────

export interface FeedbackProvidedPayload extends BaseEmailPayload {
  recipientName: string;
  adminName: string;
  /** The type of item the feedback is about */
  itemType: 'time-log' | 'breakthrough';
  /** The ticket title or breakthrough title */
  itemTitle: string;
  comment: string;
  dashboardUrl: string;
}

// ─── Onboarding ────────────────────────────────────────────────────────────

export interface WelcomeEmailPayload extends BaseEmailPayload {
  userName: string;
  dashboardUrl: string;
}

// ─── Weekly Digest ─────────────────────────────────────────────────────────

export interface WeeklyDigestPayload extends BaseEmailPayload {
  recipientName: string;
  weekLabel: string; // e.g. "March 10 – 16, 2026"
  ticketsCompleted: number;
  ticketsInProgress: number;
  hoursLogged: number;
  goalsCompleted: number;
  goalsTotal: number;
  dashboardUrl: string;
}

// ─── Billing & Subscription ────────────────────────────────────────────────
export interface SubscriptionUpgradedPayload extends BaseEmailPayload {
  adminName: string;
  planName: string;
  maxMembers: string;
  maxProjects: string;
  billingPortalUrl: string;
}

export interface SubscriptionCanceledPayload extends BaseEmailPayload {
  adminName: string;
  planName: string;
  endsAtDate: string;
  reSubscribeUrl: string;
}
