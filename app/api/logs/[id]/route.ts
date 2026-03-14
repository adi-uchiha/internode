import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timeLogs, members, tickets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { ForbiddenError, NotFoundError } from '@/lib/api-error';

export const PATCH = withErrorHandler(async (request, { params, session }) => {
  const { id } = await params;
  const body = await request.json();

  const orgId = session!.session.activeOrganizationId;
  if (!orgId) throw new Error('No active organization');

  // Find membership
  const member = await db.query.members.findFirst({
    where: and(eq(members.userId, session!.user.id), eq(members.organizationId, orgId)),
  });

  const isOrgManager = member?.role === 'admin' || member?.role === 'owner';

  const existingLog = await db.query.timeLogs.findFirst({
    where: and(eq(timeLogs.id, id), eq(timeLogs.organizationId, orgId)),
  });

  if (!existingLog) {
    throw new NotFoundError('Log not found');
  }

  if (!isOrgManager && existingLog.userId !== session!.user.id) {
    throw new ForbiddenError();
  }

  const updateData: Partial<typeof timeLogs.$inferInsert> = {};

  if (body.hours !== undefined) updateData.hours = body.hours;
  if (body.note !== undefined) updateData.note = body.note;
  if (body.date !== undefined) updateData.date = new Date(body.date);
  if (body.isBreakthrough !== undefined) updateData.isBreakthrough = body.isBreakthrough;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(existingLog);
  }

  const [updatedLog] = await db
    .update(timeLogs)
    .set(updateData)
    .where(and(eq(timeLogs.id, id), eq(timeLogs.organizationId, orgId)))
    .returning();

  // Sync ticket logged hours if hours were changed
  if (body.hours !== undefined && existingLog.ticketId) {
    const diff = body.hours - existingLog.hours;
    if (diff !== 0) {
      const ticket = await db.query.tickets.findFirst({
        where: and(eq(tickets.id, existingLog.ticketId), eq(tickets.organizationId, orgId)),
      });

      if (ticket) {
        await db
          .update(tickets)
          .set({
            loggedHours: (ticket.loggedHours || 0) + diff,
            updatedAt: new Date(),
          })
          .where(eq(tickets.id, existingLog.ticketId));
      }
    }
  }

  return NextResponse.json(updatedLog);
});
