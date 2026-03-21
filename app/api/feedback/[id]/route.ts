import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, breakthroughs, organizations, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { BadRequestError, NotFoundError } from '@/lib/api-error';
import { EmailService } from '@/lib/email/service';
import { NEXT_PUBLIC_APP_URL } from '@/lib/env';

export const POST = withErrorHandler(
  async (request, { params, session, orgId }) => {
    const { id } = await params;
    const body = await request.json();
    const { type, comment } = body;

    if (!type || !['log', 'breakthrough'].includes(type)) {
      throw new BadRequestError('Invalid type. Must be "log" or "breakthrough"');
    }

    if (!comment || typeof comment !== 'string' || comment.trim() === '') {
      throw new BadRequestError('Comment is required');
    }

    let recipientUserId: string | null = null;
    let itemTitle: string = 'your submission';

    if (type === 'log') {
      // Fetch the time log with its related ticket (for the title)
      const log = await db.query.timeLogs.findFirst({
        where: and(eq(timeLogs.id, id), eq(timeLogs.organizationId, orgId!)),
        with: {
          ticket: { columns: { title: true } },
        },
      });

      if (!log) throw new NotFoundError('Time log not found');

      await db
        .update(timeLogs)
        .set({ adminComment: comment })
        .where(and(eq(timeLogs.id, id), eq(timeLogs.organizationId, orgId!)));

      recipientUserId = log.userId;
      itemTitle = log.ticket?.title ?? 'time log';
    } else {
      // Fetch the breakthrough
      const bt = await db.query.breakthroughs.findFirst({
        where: and(eq(breakthroughs.id, id), eq(breakthroughs.organizationId, orgId!)),
      });

      if (!bt) throw new NotFoundError('Breakthrough not found');

      await db
        .update(breakthroughs)
        .set({ adminComment: comment })
        .where(and(eq(breakthroughs.id, id), eq(breakthroughs.organizationId, orgId!)));

      recipientUserId = bt.userId;
      itemTitle = bt.title;
    }

    // --- Email + In-App Notification to the record owner (fire-and-forget) ---
    if (recipientUserId && recipientUserId !== session!.user.id) {
      const recipient = await db.query.users.findFirst({
        where: eq(users.id, recipientUserId),
        columns: { email: true, name: true },
      });

      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId!),
        columns: { name: true },
      });

      if (recipient) {
        void EmailService.feedbackProvided({
          organizationId: orgId!,
          recipientId: recipientUserId,
          recipientEmail: recipient.email,
          payload: {
            to: recipient.email,
            organizationName: org?.name ?? 'Your Organization',
            recipientName: recipient.name,
            adminName: session!.user.name || session!.user.email,
            itemType: type === 'log' ? 'time-log' : 'breakthrough',
            itemTitle,
            comment,
            dashboardUrl: `${NEXT_PUBLIC_APP_URL}/tasks/feedback`,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  },
  { requiredRole: 'admin' }
);
