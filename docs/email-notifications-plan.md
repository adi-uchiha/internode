# Email Notifications — Technical Implementation Plan

## Overview

Production-grade, modular email notification system for Internode. The architecture
extends `NotificationService` into a unified **`EmailService`** that handles both
in-app notifications (DB inserts) and transactional emails (SMTP via `emailjs`)
from a **single call point**. Existing API routes stay clean — no new conditional
logic is added to them directly.

### Design Principles

- ✅ **Fire-and-forget** — Email dispatch never blocks or breaks the primary action
- ✅ **Single responsibility** — Routes call `EmailService`, not `SMTPClient` directly
- ✅ **User-preference-aware** — All email types respect `notificationSettings` before sending
- ✅ **Template parity** — Every email uses a typed `@react-email` component identical in style to `InvitationEmail.tsx`
- ✅ **Secure cron endpoints** — GitHub Actions pings bearer-token-protected `/api/cron/*` routes
- ✅ **Cache-integrated** — The client-side notification bell updates optimistically via `CacheManager.notifications`
- ✅ **Full edge-case handling** — SMTP errors log but never throw; preference opt-outs short-circuit early

---

## Architecture Diagram

```
User Action (route handler)
        │
        ▼
┌───────────────────────────────────────┐
│           EmailService                │
│  (lib/email/service.ts)               │
│                                       │
│  1. Check notificationSettings pref   │
│  2. Render React Email template       │
│  3. Send SMTP via emailjs client      │
│  4. Insert in-app notification row    │
└───────────────────────────────────────┘
        │                │
        ▼                ▼
   emails/           notifications table
  (templates)        (in-app bell)
```

---

## What Already Exists (Audit Findings)

| What                               | Where                                        | State                                                                   |
| ---------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| SMTP Client                        | `lib/email.ts`                               | ✅ Done — `emailjs` SMTPClient                                          |
| Invitation Email                   | `lib/auth.ts` + `emails/InvitationEmail.tsx` | ⚠️ Works, but bypasses EmailService — inline SMTP call in `lib/auth.ts` |
| In-app NotificationService         | `lib/notifications.ts`                       | ✅ Done — DB insert only                                                |
| Notification Bell cache domain     | `lib/cache/domains/notifications.ts`         | ✅ Done                                                                 |
| User `notificationSettings` column | `db/schema/users.ts`                         | ✅ Done — `jsonb` column                                                |
| Ticket assignment notification     | `app/api/tickets/[id]/route.ts:103`          | ⚠️ In-app only — no email                                               |
| Ticket status notification         | `app/api/tickets/[id]/route.ts:116`          | ⚠️ In-app only — no email                                               |
| Comment notification               | `app/api/tickets/[id]/comments/route.ts:75`  | ⚠️ In-app only — no email                                               |
| Time-logged notification           | `app/api/tickets/[id]/time/route.ts:52`      | ⚠️ In-app only — no email                                               |
| Member-joined notification         | `app/api/events/member-joined/route.ts`      | ⚠️ In-app only — no email                                               |
| Leave approval/rejection           | `app/api/leaves/[id]/route.ts`               | ❌ No notification at all                                               |
| Leave submission                   | `app/api/leaves/route.ts`                    | ❌ No notification at all                                               |
| Admin feedback on time logs        | `app/api/feedback/[id]/route.ts`             | ❌ No notification at all                                               |
| Breakthrough published             | `app/api/breakthroughs/route.ts`             | ❌ No notification at all                                               |
| Overdue ticket check               | N/A                                          | ❌ Not implemented                                                      |
| Weekly digest                      | N/A                                          | ❌ Not implemented                                                      |

---

## Migration: Invitation Email → EmailService

The invitation email currently works but is implemented as a **one-off inline SMTP call** directly inside `lib/auth.ts`. This bypasses the entire upcoming `EmailService` toolchain — it has no preference check, no structured logging, and no `dispatch()` wrapper.

As part of this plan, the invitation email is migrated into `EmailService` so it becomes a first-class citizen of the email system alongside all other notifications.

### What Changes

**Before (current state in `lib/auth.ts`):**

```typescript
sendInvitationEmail: async (data) => {
  try {
    const html = await render(InvitationEmail({ ... }));
    await client.sendAsync({         // ← raw client import
      from: RESEND_FROM_EMAIL,
      to: data.email,
      subject: `...`,
      attachment: [{ data: html, alternative: true }],
    });
  } catch (err) {
    console.error('[auth] CRITICAL_EMAIL_FAILURE:', ...);
  }
},
```

**After (migrated into EmailService):**

```typescript
sendInvitationEmail: async (data) => {
  // Single clean call — dispatch, error handling, and logging
  // are all owned by EmailService internally.
  void EmailService.sendInvitation({
    inviteeEmail: data.email,
    payload: {
      to: data.email,
      organizationName: data.organization.name,
      inviterName: data.inviter.user.name || 'A team member',
      inviterEmail: data.inviter.user.email,
      role: data.role,
      acceptUrl: `${NEXT_PUBLIC_APP_URL}/accept-invite?invitationId=${data.id}`,
      expiresInDays: 7,
      baseUrl: NEXT_PUBLIC_APP_URL,
    },
  });
},
```

### Key Points

- **`InvitationEmail.tsx` is NOT modified** — the template component stays exactly as-is
- **`BaseEmailLayout.tsx` will be extracted from it** — the shared styles are pulled out during template refactor (other templates import the layout; `InvitationEmail.tsx` is updated to use the layout too)
- The raw `import { client } from './email'` in `lib/auth.ts` is removed — `auth.ts` only imports `EmailService`
- Invitation emails bypass the preference check because invitations are always transactional (you must receive them to onboard)
- The `InvitationEmailPayload` interface is added to `lib/email/types.ts` so it is typed consistently with all other payloads

### [MODIFY] `lib/auth.ts` (invitation section)

```diff
- import { client } from './email';
- import { RESEND_FROM_EMAIL, NEXT_PUBLIC_APP_URL } from './env';
- import { InvitationEmail } from '@/emails/InvitationEmail';
+ import { EmailService } from './email/service';
+ import { NEXT_PUBLIC_APP_URL } from './env';

  sendInvitationEmail: async (data) => {
-   try {
-     const acceptUrl = `${NEXT_PUBLIC_APP_URL}/accept-invite?invitationId=${data.id}`;
-     const html = await render(InvitationEmail({ ... }));
-     await client.sendAsync({ ... });
-     console.log(`[auth] Invitation email sent to ${data.email}`);
-   } catch (err: unknown) {
-     console.error('[auth] CRITICAL_EMAIL_FAILURE:', { ... });
-   }
+   void EmailService.sendInvitation({
+     inviteeEmail: data.email,
+     payload: {
+       to: data.email,
+       organizationName: data.organization.name,
+       inviterName: data.inviter.user.name || 'A team member',
+       inviterEmail: data.inviter.user.email,
+       role: data.role,
+       acceptUrl: `${NEXT_PUBLIC_APP_URL}/accept-invite?invitationId=${data.id}`,
+       expiresInDays: 7,
+       baseUrl: NEXT_PUBLIC_APP_URL,
+     },
+   });
  },
```

---

## Proposed Code Structure

### New & Modified Files

| Action       | File                                       | Purpose                                             |
| ------------ | ------------------------------------------ | --------------------------------------------------- |
| **[NEW]**    | `lib/email/types.ts`                       | All shared email payload interfaces                 |
| **[NEW]**    | `lib/email/service.ts`                     | Unified `EmailService` — the single dispatch hub    |
| **[NEW]**    | `lib/email/preferences.ts`                 | User preference check utility                       |
| **[RENAME]** | `lib/email.ts` → `lib/email/client.ts`     | The raw SMTP client is now in its own module        |
| **[NEW]**    | `emails/TicketAssignedEmail.tsx`           | React Email template                                |
| **[NEW]**    | `emails/TicketStatusEmail.tsx`             | React Email template                                |
| **[NEW]**    | `emails/NewCommentEmail.tsx`               | React Email template                                |
| **[NEW]**    | `emails/LeaveStatusEmail.tsx`              | React Email template (approved + rejected)          |
| **[NEW]**    | `emails/LeaveSubmittedEmail.tsx`           | React Email template (sent to admin)                |
| **[NEW]**    | `emails/MemberJoinedEmail.tsx`             | React Email template (sent to admins)               |
| **[NEW]**    | `emails/FeedbackProvidedEmail.tsx`         | React Email template                                |
| **[NEW]**    | `emails/WelcomeEmail.tsx`                  | React Email template                                |
| **[NEW]**    | `emails/shared/BaseEmailLayout.tsx`        | Shared layout wrapper (header, footer, styles)      |
| **[NEW]**    | `app/api/cron/overdue/route.ts`            | Secured cron endpoint for overdue reminders         |
| **[NEW]**    | `app/api/cron/weekly-digest/route.ts`      | Secured cron endpoint for weekly digest             |
| **[NEW]**    | `.github/workflows/cron-overdue.yml`       | GitHub Actions — runs daily                         |
| **[NEW]**    | `.github/workflows/cron-weekly-digest.yml` | GitHub Actions — runs every Sunday                  |
| **[MODIFY]** | `lib/env.ts`                               | Add `CRON_SECRET` server var                        |
| **[MODIFY]** | `lib/notifications.ts`                     | `NotificationService` delegates to `EmailService`   |
| **[MODIFY]** | `app/api/leaves/route.ts`                  | Add `EmailService.leaveSubmitted()` call            |
| **[MODIFY]** | `app/api/leaves/[id]/route.ts`             | Add `EmailService.leaveStatusChanged()` call        |
| **[MODIFY]** | `app/api/feedback/[id]/route.ts`           | Add `EmailService.feedbackProvided()` call          |
| **[MODIFY]** | `app/api/breakthroughs/route.ts`           | Add `EmailService.breakthroughPublished()` call     |
| **[MODIFY]** | `app/api/events/member-joined/route.ts`    | Add `EmailService.memberJoined()` call              |
| **[MODIFY]** | `lib/auth.ts`                              | Add `EmailService.welcome()` in `user.create.after` |

---

## Layer 1 — Email Infrastructure (`lib/email/`)

The raw SMTP client is unchanged but moves into a clean subfolder.

---

### [RENAME] `lib/email.ts` → `lib/email/client.ts`

Move the existing file. **No functional changes.** All other imports are updated.

```typescript
// lib/email/client.ts
import { SMTPClient } from 'emailjs';
import { SMTP_USER, SMTP_PASSWORD } from '../env';

/**
 * Universal SMTP client using emailjs.
 * Configured for Gmail SMTP with an App Password.
 * Do not import this directly in route handlers — use EmailService instead.
 */
export const smtpClient = new SMTPClient({
  user: SMTP_USER,
  password: SMTP_PASSWORD,
  host: 'smtp.gmail.com',
  ssl: true,
});
```

---

### [NEW] `lib/email/types.ts`

> [!NOTE]
> `InvitationEmailPayload` is added here to bring the existing template into the typed payload system. The template props are unchanged — only the interface is now declared here as the source of truth.

Strongly-typed payload interfaces for every email notification event.
This is the contract between route handlers and the `EmailService`.

```typescript
/**
 * Base fields required for every email dispatch.
 * `to` can be a single string or array for multi-recipient emails (e.g. all admins).
 */
export interface BaseEmailPayload {
  to: string | string[];
  organizationName: string;
}

export interface TicketAssignedPayload extends BaseEmailPayload {
  assigneeName: string;
  assignerName: string;
  ticketShortId: string; // e.g. "VELO-12"
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
  commentSnippet: string; // first 200 chars
  ticketUrl: string;
}

export interface LeaveStatusPayload extends BaseEmailPayload {
  requesterName: string;
  leaveType: string;
  leaveDate: string; // formatted date string
  status: 'approved' | 'rejected';
  reason?: string;
  dashboardUrl: string;
}

export interface LeaveSubmittedPayload extends BaseEmailPayload {
  requesterName: string;
  leaveType: string;
  leaveDate: string;
  reason?: string;
  dashboardUrl: string; // link to admin leave management page
}

export interface MemberJoinedPayload extends BaseEmailPayload {
  adminName: string;
  newMemberName: string;
  newMemberEmail: string;
  membersUrl: string;
}

export interface FeedbackProvidedPayload extends BaseEmailPayload {
  recipientName: string;
  adminName: string;
  itemType: 'time-log' | 'breakthrough';
  itemTitle: string; // e.g. ticket title or breakthrough title
  comment: string;
  dashboardUrl: string;
}

export interface WelcomeEmailPayload extends BaseEmailPayload {
  userName: string;
  dashboardUrl: string;
}

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
```

---

### [NEW] `lib/email/preferences.ts`

Reads the user's `notificationSettings` and determines if a given email
category should be sent. Always yields `true` when `notificationSettings` is
`null` (opt-in by default).

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * The full set of toggleable email notification types.
 * Keys map directly to notificationSettings.email.<key>
 */
export type EmailPreferenceKey =
  | 'ticketAssigned'
  | 'ticketStatusChanged'
  | 'newComment'
  | 'leaveStatus'
  | 'leaveSubmitted'
  | 'memberJoined'
  | 'feedbackProvided'
  | 'overdueReminder'
  | 'weeklyDigest';

/**
 * Checks whether a specific user has opted into receiving
 * a given email notification type.
 *
 * Returns true by default if no preference is set.
 */
export async function isEmailEnabled(userId: string, key: EmailPreferenceKey): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { notificationSettings: true },
  });

  const settings = user?.notificationSettings;
  if (!settings?.email) return true; // opt-in by default

  // If the key is explicitly set to false, block the email
  return settings.email[key] !== false;
}

/**
 * Batch check for multiple users. Returns only the user IDs
 * for which the given email preference is enabled.
 * Efficient: single DB query for all users.
 */
export async function filterEnabledRecipients(
  userIds: string[],
  key: EmailPreferenceKey
): Promise<string[]> {
  if (userIds.length === 0) return [];

  const { inArray } = await import('drizzle-orm');

  const result = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: { id: true, notificationSettings: true },
  });

  return result
    .filter((u) => {
      const settings = u.notificationSettings;
      if (!settings?.email) return true;
      return settings.email[key] !== false;
    })
    .map((u) => u.id);
}
```

---

### [NEW] `lib/email/service.ts`

The **single dispatch hub** for all transactional emails. Route handlers call
methods here. The service internally renders the React Email template, sends via
SMTP, and also inserts the in-app notification via `NotificationService`.

This is the key design: **routes stay clean; all email + notification logic lives here**.

```typescript
import { render } from '@react-email/render';
import { smtpClient } from './client';
import { RESEND_FROM_EMAIL, NEXT_PUBLIC_APP_URL } from '../env';
import { NotificationService } from '../notifications';
import { isEmailEnabled, filterEnabledRecipients } from './preferences';

// Template imports
import { TicketAssignedEmail } from '@/emails/TicketAssignedEmail';
import { TicketStatusEmail } from '@/emails/TicketStatusEmail';
import { NewCommentEmail } from '@/emails/NewCommentEmail';
import { LeaveStatusEmail } from '@/emails/LeaveStatusEmail';
import { LeaveSubmittedEmail } from '@/emails/LeaveSubmittedEmail';
import { MemberJoinedEmail } from '@/emails/MemberJoinedEmail';
import { FeedbackProvidedEmail } from '@/emails/FeedbackProvidedEmail';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

// Payload types
import type {
  TicketAssignedPayload,
  TicketStatusChangedPayload,
  NewCommentPayload,
  LeaveStatusPayload,
  LeaveSubmittedPayload,
  MemberJoinedPayload,
  FeedbackProvidedPayload,
  WelcomeEmailPayload,
} from './types';

/**
 * Internal helper — renders template and sends via SMTP.
 * Never throws — all failures are caught and logged.
 * This design ensures email failures never break the primary action (DB write).
 */
async function dispatch(opts: {
  to: string | string[];
  subject: string;
  html: string;
  context: string; // for logging — e.g. 'ticket-assigned'
}): Promise<void> {
  try {
    const recipients = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;
    await smtpClient.sendAsync({
      from: RESEND_FROM_EMAIL,
      to: recipients,
      subject: opts.subject,
      attachment: [{ data: opts.html, alternative: true }],
    });
    console.log(`[EmailService:${opts.context}] Sent to: ${recipients}`);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[EmailService:${opts.context}] SMTP FAILURE:`, {
      to: opts.to,
      error: error.message,
      stack: error.stack,
    });
    // Never rethrow — email delivery is non-blocking
  }
}

export const EmailService = {
  /**
   * Ticket Assigned — send to the new assignee only.
   * Also creates an in-app notification via NotificationService.
   */
  async ticketAssigned(params: {
    organizationId: string;
    assigneeId: string;
    assigneeEmail: string;
    payload: TicketAssignedPayload;
  }): Promise<void> {
    // In-app notification (always — no preference gate for in-app)
    await NotificationService.notifyAssignment({
      organizationId: params.organizationId,
      ticketId: params.payload.ticketShortId,
      ticketTitle: params.payload.ticketTitle,
      assigneeId: params.assigneeId,
      assignerName: params.payload.assignerName,
    });

    // Email — respect preference
    if (!(await isEmailEnabled(params.assigneeId, 'ticketAssigned'))) return;

    const html = await render(TicketAssignedEmail(params.payload));
    await dispatch({
      to: params.assigneeEmail,
      subject: `You've been assigned to ${params.payload.ticketShortId}: ${params.payload.ticketTitle}`,
      html,
      context: 'ticket-assigned',
    });
  },

  /**
   * Ticket Status Changed — notifies creator and assignee (excluding the actor).
   */
  async ticketStatusChanged(params: {
    organizationId: string;
    ticketId: string;
    payload: TicketStatusChangedPayload;
    recipients: { userId: string; email: string; name: string }[];
    excludeUserId: string;
  }): Promise<void> {
    const { organizationId, ticketId, excludeUserId, recipients, payload } = params;

    // In-app notification
    await NotificationService.notifyTicketEvent({
      organizationId,
      ticketId,
      type: 'status',
      title: 'Status Updated',
      subtitle: `[${payload.ticketShortId}] Moved to ${payload.newStatus.toUpperCase()}`,
      excludeUserId,
    });

    // Email — batch preference check
    const eligibleUserIds = await filterEnabledRecipients(
      recipients.map((r) => r.userId).filter((id) => id !== excludeUserId),
      'ticketStatusChanged'
    );

    for (const recipient of recipients.filter((r) => eligibleUserIds.includes(r.userId))) {
      const html = await render(TicketStatusEmail({ ...payload, recipientName: recipient.name }));
      await dispatch({
        to: recipient.email,
        subject: `[${payload.ticketShortId}] Status changed to ${payload.newStatus}`,
        html,
        context: 'ticket-status-changed',
      });
    }
  },

  /**
   * New Comment — notifies ticket creator and assignee (excluding the commenter).
   */
  async newComment(params: {
    organizationId: string;
    ticketId: string;
    payload: NewCommentPayload;
    recipients: { userId: string; email: string; name: string }[];
    excludeUserId: string;
  }): Promise<void> {
    const { organizationId, ticketId, excludeUserId, recipients, payload } = params;

    await NotificationService.notifyTicketEvent({
      organizationId,
      ticketId,
      type: 'comment',
      title: 'New Comment',
      subtitle: `[${payload.ticketShortId}] ${payload.commenterName}: ${payload.commentSnippet}`,
      excludeUserId,
    });

    const eligibleUserIds = await filterEnabledRecipients(
      recipients.map((r) => r.userId).filter((id) => id !== excludeUserId),
      'newComment'
    );

    for (const recipient of recipients.filter((r) => eligibleUserIds.includes(r.userId))) {
      const html = await render(NewCommentEmail({ ...payload, recipientName: recipient.name }));
      await dispatch({
        to: recipient.email,
        subject: `New comment on [${payload.ticketShortId}] ${payload.ticketTitle}`,
        html,
        context: 'new-comment',
      });
    }
  },

  /**
   * Leave Request Submitted — sends to all org admins.
   */
  async leaveSubmitted(params: {
    organizationId: string;
    adminRecipients: { userId: string; email: string; name: string }[];
    payload: LeaveSubmittedPayload;
  }): Promise<void> {
    const eligibleUserIds = await filterEnabledRecipients(
      params.adminRecipients.map((a) => a.userId),
      'leaveSubmitted'
    );

    // In-app notification to each admin
    for (const admin of params.adminRecipients) {
      await NotificationService.create({
        organizationId: params.organizationId,
        userId: admin.userId,
        type: 'leave-requested',
        title: 'New Leave Request',
        subtitle: `${params.payload.requesterName} requested ${params.payload.leaveType} leave`,
      });
    }

    for (const admin of params.adminRecipients.filter((a) => eligibleUserIds.includes(a.userId))) {
      const html = await render(LeaveSubmittedEmail({ ...params.payload, adminName: admin.name }));
      await dispatch({
        to: admin.email,
        subject: `Leave Request: ${params.payload.requesterName} — ${params.payload.leaveType}`,
        html,
        context: 'leave-submitted',
      });
    }
  },

  /**
   * Leave Status Changed (approved / rejected) — sent to the requester.
   */
  async leaveStatusChanged(params: {
    organizationId: string;
    requesterId: string;
    requesterEmail: string;
    payload: LeaveStatusPayload;
  }): Promise<void> {
    const { organizationId, requesterId, requesterEmail, payload } = params;
    const status = payload.status === 'approved' ? 'approved' : 'rejected';

    // In-app notification
    await NotificationService.create({
      organizationId,
      userId: requesterId,
      type: 'leave-status',
      title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      subtitle: `Your ${payload.leaveType} leave request has been ${status}`,
    });

    if (!(await isEmailEnabled(requesterId, 'leaveStatus'))) return;

    const html = await render(LeaveStatusEmail(payload));
    await dispatch({
      to: requesterEmail,
      subject: `Your leave request has been ${status}`,
      html,
      context: `leave-${status}`,
    });
  },

  /**
   * Member Joined — sent to all admins.
   */
  async memberJoined(params: {
    organizationId: string;
    adminRecipients: { userId: string; email: string; name: string }[];
    payload: MemberJoinedPayload;
  }): Promise<void> {
    const eligibleUserIds = await filterEnabledRecipients(
      params.adminRecipients.map((a) => a.userId),
      'memberJoined'
    );

    // In-app notifications already handled by existing events/member-joined route.
    // EmailService only layers the email on top.

    for (const admin of params.adminRecipients.filter((a) => eligibleUserIds.includes(a.userId))) {
      const html = await render(MemberJoinedEmail({ ...params.payload, adminName: admin.name }));
      await dispatch({
        to: admin.email,
        subject: `${params.payload.newMemberName} has joined ${params.payload.organizationName}`,
        html,
        context: 'member-joined',
      });
    }
  },

  /**
   * Feedback Provided — admin left an adminComment on a time log or breakthrough.
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
      subtitle: `${payload.adminName} left feedback on your ${payload.itemType}`,
    });

    if (!(await isEmailEnabled(recipientId, 'feedbackProvided'))) return;

    const html = await render(FeedbackProvidedEmail(payload));
    await dispatch({
      to: recipientEmail,
      subject: `${payload.adminName} left feedback on your ${payload.itemType}`,
      html,
      context: 'feedback-provided',
    });
  },

  /**
   * Invitation Email — migrated from the inline call in lib/auth.ts.
   * Uses the existing InvitationEmail template unchanged.
   * No preference gate — invitations are always transactional.
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

  /**
   * Welcome Email — sent to a user immediately after account creation.
   */
  async welcome(params: { userEmail: string; payload: WelcomeEmailPayload }): Promise<void> {
    const html = await render(WelcomeEmail(params.payload));
    await dispatch({
      to: params.userEmail,
      subject: `Welcome to Internode, ${params.payload.userName}!`,
      html,
      context: 'welcome',
    });
  },
};
```

---

## Layer 2 — React Email Templates (`emails/`)

All templates follow the exact same dark-mode design system as `InvitationEmail.tsx`:

- Background: `#080808`, Container: `#111111`
- Brand accent: `#00ff55` (green)
- Font: `Space Grotesk`
- Header: Logo + "INTERNODE" wordmark
- Footer: `© {year} Internode · Engineering-Grade Project Management`

To avoid 200+ lines of inline styles per file, all shared styles and the outer
wrapper (header, footer, container) are extracted into a shared layout.

---

### [NEW] `emails/shared/BaseEmailLayout.tsx`

```typescript
/**
 * Shared layout wrapper for all Internode transactional emails.
 * Usage:
 *   <BaseEmailLayout preview="Preview text here">
 *     <Heading>...</Heading>
 *     <Text>...</Text>
 *   </BaseEmailLayout>
 */
export function BaseEmailLayout({
  preview,
  children,
  baseUrl,
}: {
  preview: string;
  children: React.ReactNode;
  baseUrl: string;
}): JSX.Element;
```

Internals: renders `<Html>`, `<Head>` with Space Grotesk font, `<Preview>`,
`<Body>` with `main` style, the logo header section, a `<Container>` wrapping
the `children` body section, and the footer. The exact styles from
`InvitationEmail.tsx` are shared here.

---

### [NEW] `emails/TicketAssignedEmail.tsx`

```
Props: TicketAssignedPayload

Subject line: "You've been assigned to {ticketShortId}: {ticketTitle}"

Body:
  Heading: "New task assigned to you"
  "You were assigned to ticket {ticketShortId} — {ticketTitle} in {organizationName}
  by {assignerName}."
  CTA Button: "OPEN TICKET" → ticketUrl
  Footer disclaimer: "You're receiving this because you were made an assignee."
```

---

### [NEW] `emails/TicketStatusEmail.tsx`

```
Props: TicketStatusChangedPayload

Subject line: "[{ticketShortId}] Status changed to {newStatus}"

Body:
  Heading: "Ticket status updated"
  "{changedByName} moved [{ticketShortId}] {ticketTitle}
  from {oldStatus} → {newStatus} in {organizationName}."
  CTA Button: "VIEW TICKET" → ticketUrl
```

---

### [NEW] `emails/NewCommentEmail.tsx`

```
Props: NewCommentPayload

Subject line: "New comment on [{ticketShortId}] {ticketTitle}"

Body:
  Heading: "{commenterName} left a comment"
  Quote block styled in #1a1a1a with left green border:
    "{commentSnippet}..."
  CTA Button: "VIEW COMMENT" → ticketUrl
```

---

### [NEW] `emails/LeaveSubmittedEmail.tsx`

```
Props: LeaveSubmittedPayload

Subject line: "Leave Request: {requesterName} — {leaveType}"

Body:
  Heading: "New leave request pending review"
  "{requesterName} has submitted a {leaveType} leave request for {leaveDate}."
  Reason (if provided): shown in a bordered blockquote.
  CTA Button: "REVIEW REQUEST" → dashboardUrl
```

---

### [NEW] `emails/LeaveStatusEmail.tsx`

```
Props: LeaveStatusPayload

Subject line: "Your leave request has been {status}"

Body:
  Conditional heading:
    approved → "✓ Leave Approved" (green accent)
    rejected → "✗ Leave Rejected" (muted red #ff4444)
  "{leaveType} leave for {leaveDate} has been {status}."
  Reason if rejected (shown in muted text).
  CTA Button: "VIEW MY LEAVES" → dashboardUrl
```

---

### [NEW] `emails/MemberJoinedEmail.tsx`

```
Props: MemberJoinedPayload

Subject line: "{newMemberName} has joined {organizationName}"

Body:
  Heading: "A new member has joined"
  "{newMemberName} ({newMemberEmail}) has joined {organizationName}."
  CTA Button: "VIEW MEMBERS" → membersUrl
```

---

### [NEW] `emails/FeedbackProvidedEmail.tsx`

```
Props: FeedbackProvidedPayload

Subject line: "{adminName} left feedback on your {itemType}"

Body:
  Heading: "You received feedback"
  "{adminName} reviewed your {itemType} — {itemTitle} and left the following comment:"
  Quote block: "{comment}"
  CTA Button: "VIEW FEEDBACK" → dashboardUrl
```

---

### [NEW] `emails/WelcomeEmail.tsx`

```
Props: WelcomeEmailPayload

Subject line: "Welcome to Internode, {userName}!"

Body:
  Heading: "Welcome aboard 🚀"
  "Hi {userName}, your Internode account is ready. Start by creating or
  joining an organization to access your workspace."
  CTA Button: "GO TO DASHBOARD" → dashboardUrl
```

---

## Layer 3 — Route Handler Integration

Each route handler is modified minimally. The existing DB write logic is
**not touched**. A single `EmailService.*()` call is appended after the
successful DB write. Because `EmailService` is fire-and-forget (never throws),
the response is never delayed or broken.

---

### [MODIFY] `app/api/tickets/[id]/route.ts` — PATCH Handler

Replace existing `NotificationService` calls with `EmailService` calls.
The `EmailService` internally calls `NotificationService`, so the in-app
notification still fires.

```typescript
// After the DB update succeeds...

// 1. Ticket Assigned
if (body.assigneeId && body.assigneeId !== existingTicket.assigneeId) {
  const assignee = await db.query.users.findFirst({
    where: eq(users.id, body.assigneeId),
    columns: { email: true, name: true },
  });
  if (assignee) {
    void EmailService.ticketAssigned({
      organizationId: orgId!,
      assigneeId: body.assigneeId,
      assigneeEmail: assignee.email,
      payload: {
        to: assignee.email,
        organizationName: '...', // fetched from org
        assigneeName: assignee.name,
        assignerName: session!.user.name,
        ticketShortId: updatedTicketRaw.ticketId,
        ticketTitle: updatedTicketRaw.title,
        ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${updatedTicketRaw.ticketId}`,
      },
    });
  }
}

// 2. Status Changed
if (body.status && body.status !== existingTicket.status) {
  // Fetch creator + assignee emails for notification
  void EmailService.ticketStatusChanged({ ... });
}
```

> [!NOTE]
> The `void` keyword is intentional — it explicitly marks the operation as fire-and-forget. The response is returned to the client immediately without awaiting the email.

---

### [MODIFY] `app/api/tickets/[id]/comments/route.ts` — POST Handler

Replace `NotificationService.notifyTicketEvent` with `EmailService.newComment`.

```typescript
if (fullComment) {
  void EmailService.newComment({
    organizationId: orgId!,
    ticketId: ticket.id,
    excludeUserId: session!.user.id,
    recipients: [
      ticket.createdBy && {
        userId: ticket.createdById,
        email: ticket.createdBy.email,
        name: ticket.createdBy.name,
      },
      ticket.assignee && {
        userId: ticket.assigneeId,
        email: ticket.assignee.email,
        name: ticket.assignee.name,
      },
    ].filter(Boolean),
    payload: {
      to: [], // resolved internally
      organizationName: '...',
      commenterName: session!.user.name,
      ticketShortId: ticket.ticketId,
      ticketTitle: ticket.title,
      commentSnippet: body.content.slice(0, 200),
      ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${ticket.ticketId}`,
    },
  });
}
```

---

### [MODIFY] `app/api/leaves/route.ts` — POST Handler

After the leave is created, find all org admins and call `EmailService.leaveSubmitted`.

```typescript
// After successful DB insert of new leave request:

const adminMembers = await db.query.members.findMany({
  where: and(eq(members.organizationId, orgId!), inArray(members.role, ['owner', 'admin'])),
  with: { user: true },
});

const adminRecipients = adminMembers.map((m) => ({
  userId: m.userId,
  email: m.user.email,
  name: m.user.name,
}));

void EmailService.leaveSubmitted({
  organizationId: orgId!,
  adminRecipients,
  payload: {
    to: adminRecipients.map((a) => a.email),
    organizationName: '...',
    requesterName: session!.user.name,
    leaveType: body.type,
    leaveDate: format(new Date(body.date), 'MMMM d, yyyy'),
    reason: body.reason,
    dashboardUrl: `${NEXT_PUBLIC_APP_URL}/tasks/leaves`,
  },
});
```

---

### [MODIFY] `app/api/leaves/[id]/route.ts` — PATCH Handler

After admin updates status, call `EmailService.leaveStatusChanged` for the requester.

```typescript
// After successful DB update:
const requester = await db.query.users.findFirst({
  where: eq(users.id, updatedLeave.userId),
  columns: { email: true, name: true },
});

if (requester) {
  void EmailService.leaveStatusChanged({
    organizationId: orgId!,
    requesterId: updatedLeave.userId,
    requesterEmail: requester.email,
    payload: {
      to: requester.email,
      organizationName: '...',
      requesterName: requester.name,
      leaveType: updatedLeave.type,
      leaveDate: format(updatedLeave.date, 'MMMM d, yyyy'),
      status: status as 'approved' | 'rejected',
      dashboardUrl: `${NEXT_PUBLIC_APP_URL}/tasks/leaves`,
    },
  });
}
```

---

### [MODIFY] `app/api/feedback/[id]/route.ts` — POST Handler

After admin comment is saved on a time log or breakthrough, locate the original
record owner and dispatch feedback email.

```typescript
// After DB update:
let recipientUserId: string | undefined;
let itemTitle: string = 'your submission';

if (type === 'log') {
  const log = await db.query.timeLogs.findFirst({
    where: eq(timeLogs.id, id),
    with: { user: true, ticket: true },
  });
  recipientUserId = log?.userId;
  itemTitle = log?.ticket?.title ?? itemTitle;
} else {
  const bt = await db.query.breakthroughs.findFirst({
    where: eq(breakthroughs.id, id),
    with: { user: true },
  });
  recipientUserId = bt?.userId;
  itemTitle = bt?.title ?? itemTitle;
}

if (recipientUserId) {
  const recipient = await db.query.users.findFirst({
    where: eq(users.id, recipientUserId),
    columns: { email: true, name: true },
  });

  if (recipient) {
    void EmailService.feedbackProvided({
      organizationId: orgId!,
      recipientId: recipientUserId,
      recipientEmail: recipient.email,
      payload: {
        to: recipient.email,
        organizationName: '...',
        recipientName: recipient.name,
        adminName: session!.user.name,
        itemType: type === 'log' ? 'time-log' : 'breakthrough',
        itemTitle,
        comment,
        dashboardUrl: `${NEXT_PUBLIC_APP_URL}/tasks/feedback`,
      },
    });
  }
}
```

---

### [MODIFY] `lib/auth.ts` — `databaseHooks.user.create.after`

```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        void EmailService.welcome({
          userEmail: user.email,
          payload: {
            to: user.email,
            organizationName: 'Internode',
            userName: user.name || user.email.split('@')[0],
            dashboardUrl: NEXT_PUBLIC_APP_URL,
          },
        });
      },
    },
  },
},
```

---

## Layer 4 — Scheduled Emails via GitHub Actions

### Secured Cron Route Handler Pattern

Both cron routes use a shared `withCronAuth` guard that validates the
`Authorization: Bearer <CRON_SECRET>` header. This prevents unauthorized triggering.

---

### [NEW] `lib/api-handler.ts` — `withCronAuth` guard

Add alongside `withErrorHandler`:

```typescript
/**
 * Wraps a cron endpoint with bearer-token authentication.
 * The token is validated against the CRON_SECRET env variable.
 * Returns 401 if the token is missing or invalid.
 */
export function withCronAuth(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      return await handler(req);
    } catch (err) {
      const error = err as Error;
      console.error('[CronJob] Unhandled error:', error.message);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
```

---

### [NEW] `app/api/cron/overdue/route.ts`

Finds all tickets with a `dueDate` in the past that are NOT in `done` status,
and sends a reminder email to the assignee.

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets, users } from '@/db/schema';
import { lt, and, ne, isNotNull, isNull, eq } from 'drizzle-orm';
import { withCronAuth } from '@/lib/api-handler';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';
import { format } from 'date-fns';

export const GET = withCronAuth(async () => {
  const now = new Date();

  // Find all overdue tickets with an assignee
  const overdueTickets = await db.query.tickets.findMany({
    where: and(
      lt(tickets.dueDate, now),
      ne(tickets.status, 'done'),
      isNotNull(tickets.dueDate),
      isNotNull(tickets.assigneeId)
    ),
    with: {
      assignee: true,
      organization: true,
    },
  });

  let sent = 0;

  for (const ticket of overdueTickets) {
    if (!ticket.assignee || !ticket.organization) continue;

    void EmailService.overdueReminder({
      assigneeId: ticket.assigneeId!,
      assigneeEmail: ticket.assignee.email,
      payload: {
        to: ticket.assignee.email,
        organizationName: ticket.organization.name,
        assigneeName: ticket.assignee.name,
        ticketShortId: ticket.ticketId,
        ticketTitle: ticket.title,
        dueDate: format(ticket.dueDate!, 'MMMM d, yyyy'),
        ticketUrl: `${NEXT_PUBLIC_APP_URL}/tasks/ticket/${ticket.ticketId}`,
      },
    });
    sent++;
  }

  return NextResponse.json({ success: true, sent });
});
```

---

### [NEW] `app/api/cron/weekly-digest/route.ts`

Aggregates per-user weekly stats and sends a digest email every Sunday.

```typescript
/**
 * Collects for the current week (Mon–Sun):
 *  - Tickets created by user
 *  - Tickets completed by user
 *  - Hours logged
 *  - Active goals + completion %
 * Sends a personalized weekly digest to each active org member.
 */
export const GET = withCronAuth(async () => {
  // ... query tickets, timeLogs, weeklyGoals for each member
  // ... call EmailService.weeklyDigest() for each eligible user
  return NextResponse.json({ success: true, sent });
});
```

---

### [NEW] `.github/workflows/cron-overdue.yml`

```yaml
name: Cron — Overdue Ticket Reminders

on:
  schedule:
    # Runs Monday–Friday at 09:00 UTC (2:30 PM IST)
    - cron: '0 9 * * 1-5'
  workflow_dispatch: # Allow manual triggering

jobs:
  ping:
    name: Trigger Overdue Endpoint
    runs-on: ubuntu-latest

    steps:
      - name: Ping /api/cron/overdue
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" \
            -X GET "${{ secrets.NEXT_PUBLIC_APP_URL }}/api/cron/overdue" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}")

          echo "HTTP Status: $response"

          if [ "$response" != "200" ]; then
            echo "::error::Cron endpoint returned non-200 status: $response"
            exit 1
          fi

          echo "::notice::Overdue reminder cron fired successfully."
```

---

### [NEW] `.github/workflows/cron-weekly-digest.yml`

```yaml
name: Cron — Weekly Digest

on:
  schedule:
    # Runs every Sunday at 07:00 UTC (12:30 PM IST)
    - cron: '0 7 * * 0'
  workflow_dispatch:

jobs:
  ping:
    name: Trigger Weekly Digest Endpoint
    runs-on: ubuntu-latest

    steps:
      - name: Ping /api/cron/weekly-digest
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" \
            -X GET "${{ secrets.NEXT_PUBLIC_APP_URL }}/api/cron/weekly-digest" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}")

          echo "HTTP Status: $response"

          if [ "$response" != "200" ]; then
            echo "::error::Cron endpoint returned non-200 status: $response"
            exit 1
          fi

          echo "::notice::Weekly digest cron fired successfully."
```

> [!IMPORTANT]
> Add two secrets in GitHub → Repository Settings → Secrets and Variables → Actions:
>
> - `NEXT_PUBLIC_APP_URL` — your Vercel production URL (e.g. `https://internode.vercel.app`)
> - `CRON_SECRET` — a long random secret (e.g. run `openssl rand -hex 32` to generate)
>
> Also add `CRON_SECRET` to your Vercel environment variables (Production only).

---

## Layer 5 — Environment Variables

Add to `.env` and Vercel (Production + Preview):

```env
# Cron job security token (server-only)
CRON_SECRET=your_random_secret_here
```

### [MODIFY] `lib/env.ts`

```typescript
// Add to private server-only variables section:
export const CRON_SECRET = requireEnv('CRON_SECRET');
```

---

## Layer 6 — Cache Integration

The client-side notification bell (`useNotifications` + `CacheManager.notifications`)
already works for in-app notifications. No changes to the cache layer are required.

When `EmailService` internally calls `NotificationService.create()`, the next poll
by `useNotifications` (or a real-time refresh) will pick up the new row and update
the bell count.

If real-time is desired, the existing polling interval in `useNotifications` handles
this. A future WebSocket layer would hook into the same `NotificationDomain` methods.

---

## Notification Preference UI

The `notificationSettings` column (`jsonb`) already exists on the `users` table with
the structure:

```typescript
{
  email: Record<string, boolean>;
  inApp: Record<string, boolean>;
}
```

A **Notification Preferences panel** must be added to `app/tasks/settings/page.tsx`
(Profile Settings) with toggles for every `EmailPreferenceKey`. The panel should:

1. Load existing `notificationSettings` from `useCurrentUser()`
2. Display a categorized list of toggles (Tickets, Leaves, Team, etc.)
3. On change: call `PATCH /api/users/profile` with the updated `notificationSettings` object
4. Optimistically update via `CacheManager.users.sync()`

```
┌──────────────────────────────────────────────────┐
│  Notification Preferences                        │
├──────────────────────────────────────────────────┤
│  Tickets                                         │
│  ○ Ticket assigned to me                  [ON ]  │
│  ○ Ticket status changes                  [ON ]  │
│  ○ New comments on my tickets             [ON ]  │
│  ○ Overdue reminders                      [ON ]  │
├──────────────────────────────────────────────────┤
│  Leave Management                                │
│  ○ Leave request status updates           [ON ]  │
│  ○ New leave submissions (Admin only)     [ON ]  │
├──────────────────────────────────────────────────┤
│  Team & Organization                             │
│  ○ New member joined (Admin only)         [ON ]  │
│  ○ Feedback on my submissions             [ON ]  │
├──────────────────────────────────────────────────┤
│  Updates                                         │
│  ○ Weekly digest                          [ON ]  │
└──────────────────────────────────────────────────┘
```

> [!NOTE]
> Admin-only toggles (e.g., "New leave submissions") should only render when `orgRole === 'admin' || 'owner'`.

---

## Files Summary

| Action       | File                                               |
| ------------ | -------------------------------------------------- |
| **[RENAME]** | `lib/email.ts` → `lib/email/client.ts`             |
| **[NEW]**    | `lib/email/types.ts`                               |
| **[NEW]**    | `lib/email/preferences.ts`                         |
| **[NEW]**    | `lib/email/service.ts`                             |
| **[NEW]**    | `emails/shared/BaseEmailLayout.tsx`                |
| **[NEW]**    | `emails/TicketAssignedEmail.tsx`                   |
| **[NEW]**    | `emails/TicketStatusEmail.tsx`                     |
| **[NEW]**    | `emails/NewCommentEmail.tsx`                       |
| **[NEW]**    | `emails/LeaveSubmittedEmail.tsx`                   |
| **[NEW]**    | `emails/LeaveStatusEmail.tsx`                      |
| **[NEW]**    | `emails/MemberJoinedEmail.tsx`                     |
| **[NEW]**    | `emails/FeedbackProvidedEmail.tsx`                 |
| **[NEW]**    | `emails/WelcomeEmail.tsx`                          |
| **[NEW]**    | `app/api/cron/overdue/route.ts`                    |
| **[NEW]**    | `app/api/cron/weekly-digest/route.ts`              |
| **[NEW]**    | `.github/workflows/cron-overdue.yml`               |
| **[NEW]**    | `.github/workflows/cron-weekly-digest.yml`         |
| **[MODIFY]** | `lib/env.ts` — add `CRON_SECRET`                   |
| **[MODIFY]** | `lib/api-handler.ts` — add `withCronAuth`          |
| **[MODIFY]** | `lib/notifications.ts` — remove duplicated logic   |
| **[MODIFY]** | `lib/auth.ts` — add `welcome` email trigger        |
| **[MODIFY]** | `app/api/tickets/[id]/route.ts` — use EmailService |
| **[MODIFY]** | `app/api/tickets/[id]/comments/route.ts`           |
| **[MODIFY]** | `app/api/tickets/[id]/time/route.ts`               |
| **[MODIFY]** | `app/api/leaves/route.ts`                          |
| **[MODIFY]** | `app/api/leaves/[id]/route.ts`                     |
| **[MODIFY]** | `app/api/feedback/[id]/route.ts`                   |
| **[MODIFY]** | `app/api/breakthroughs/route.ts`                   |
| **[MODIFY]** | `app/api/events/member-joined/route.ts`            |
| **[MODIFY]** | `app/tasks/settings/page.tsx` — preference panel   |

---

## Verification Plan

### Environment Check

```bash
# Verify env vars are present
bun run tsc --noEmit
bun run lint
bun run build
```

### Email Template Preview

```bash
# Use @react-email/render to preview templates locally
# Navigate to http://localhost:3000/api/test-email in dev
# (Create a test endpoint that renders the template to HTML and returns it)
```

### Manual Verification Checklist

**Ticket Notifications**

1. Assign a ticket to a user → assignee receives email with CTA link
2. Change ticket status → creator and old/new assignee receive email
3. Post a comment → ticket creator and assignee receive email (not the commenter)
4. Try with user who has `ticketAssigned: false` in preferences → email is blocked

**Leave Notifications**

1. Submit a leave request → all admins receive email
2. Admin approves leave → requester receives "approved" email (green heading)
3. Admin rejects leave → requester receives "rejected" email

**System Notifications**

1. Register a new account → welcome email arrives immediately
2. Accept an invite → member-joined email sent to org admins
3. Admin leaves feedback on time log → user receives feedback email

**Cron Jobs**

1. Call `GET /api/cron/overdue` without auth header → 401
2. Call with wrong token → 401
3. Call with correct `CRON_SECRET` bearer token → 200 + `{ sent: N }`
4. Manually trigger `workflow_dispatch` on GitHub Actions → workflow passes

**Preferences**

1. Toggle off "Ticket assigned to me" in settings → PATCH saves to DB
2. Get assigned to a ticket → email is NOT sent (preference gate works)
3. Toggle back on → email resumes
