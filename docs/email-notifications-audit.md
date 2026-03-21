# Email Notifications Audit & Implementation Plan

After conducting a full audit of the project's models, schemas, and existing notification infrastructure, we have identified all critical and optional user interactions that should trigger an email notification.

Currently, the system successfully handles **Organization Invitation Emails** (in `lib/auth.ts`) and triggers some in-app notifications (via `lib/notifications.ts` for tickets and members joining). Moving forward, we should extend these system events to also trigger stylized emails using our existing `emailjs` and `@react-email/render` setup.

Here is the comprehensive list of actions where emails should be sent, categorized by module:

## 1. Authentication & Onboarding

- **Welcome Email**: Triggered when a new user signs up.
- **Password Reset Request**: Triggered if a user requests to reset their password (requires proper tokens).
- **Email Verification**: Triggered to confirm a user's email address upon registration.

## 2. Organization & Team Management

- **Organization Invitation**: _[Currently Implemented]_ Triggered when an admin invites a new member.
- **Member Joined Organization**: Sent to Organization Admins when a new user successfully accepts an invite.
- **Role Updated**: Sent to the specific user when their regular role is upgraded/downgraded (e.g., Member -> Admin) by an Owner/Admin.
- **Removed from Organization**: Sent to a user to notify them that they have been removed from the organization workspace.

## 3. Ticket & Task Management

_Note: The `NotificationService` currently creates in-app notifications for these; the email triggers should be hooked into the same service._

- **Ticket Assigned**: Sent directly to the new assignee.
- **Ticket Status Changed**: Sent to the ticket creator and the current assignee (e.g., "Todo -> In Progress", or "Done").
- **Ticket Priority Changed**: Sent to the assignee to notify them of urgency shifts (e.g., "Medium -> Critical").
- **New Comment on Ticket**: Sent to the assignee, creator, and potentially anyone else who has previously commented on the thread.
- **Ticket Overdue / Deadline Approaching**: Triggered by a background cron job to remind assignees of impending or missed deadlines.

## 4. Leave Management

- **Leave Request Submitted**: Sent to Organization Admins/Managers so they are aware of pending approvals.
- **Leave Request Approved**: Sent to the person who requested the leave, confirming the dates.
- **Leave Request Rejected**: Sent to the requester, notifying them that the leave was denied.
- **Leave Cancelled**: Sent to Admins/Managers if an employee revokes an upcoming approved leave.

## 5. Projects

- **Added to Project**: Sent to a user when they are explicitly added to a project's member list.
- **Removed from Project**: Sent to a user notifying them they no longer have access to a specific project.
- **Project Created**: (Optional) Sent to Organization Admins or assigned default members to notify them of a new initiative.

## 6. Goals & Breakthroughs

- **Goal Assigned**: Sent to a user if a manager assigns them a new Weekly Goal.
- **Goal Achieved/Completed**: Sent to the user's manager/admin to highlight their success for the week.
- **Breakthrough Published**: Sent to project members or the wider organization to celebrate a major milestone being reached on a project.
- **Pending Review (Admin)**: Sent to Admins when a new Breakthrough is published, notifying them it is ready for feedback/comments.

## 7. Time Logging & Feedback

- **Manager Feedback Provided**: Sent to a user when a manager/admin leaves an `adminComment` on their submitted Time Log or Breakthrough.
- **Time Log Submitted / Pending Review**: (Optional) Sent to Admins/Managers to notify them that new time logs require review.
- **Time Log Added to Ticket**: Sent to the Ticket Assigner/Creator to notify them that work has been logged against the issue.

## 8. Productivity & System Summaries (Future Scope)

- **Weekly Digest**: An automated email sent at the end/beginning of the week summarizing tickets completed, active goals, and time logged.

---

### Implementation Recommendations

1. **Extend `NotificationService`:**
   Update `lib/notifications.ts` so that `NotificationService.create()` accepts a boolean flag or automatically queues an email payload alongside the database insertion for in-app notifications.
2. **Preference Toggles:**
   Add an `emailPreferences` JSON column to the `users` schema (if not using `notificationSettings` already) so users can opt-out of high-frequency emails like "New Comments".
3. **React-Email Templates:**
   Create styled templates in the `/emails/` directory (following the pattern of `InvitationEmail.tsx`) for `TicketAssignedEmail`, `LeaveApprovedEmail`, etc.
4. **Scheduling Infrastructure (GitHub Actions):**
   For time-based events like "Ticket Overdue" checks or "Weekly Digests", we will create one or more secured API endpoints (e.g., `/api/cron/overdue`) on Vercel. We will then configure **100% free GitHub Actions** using the `.github/workflows/` directory and `schedule: cron` syntax to securely Ping these endpoints at defined intervals using a `CRON_SECRET`.
