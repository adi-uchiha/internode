import { db } from '@/db';
import { breakthroughs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { ForbiddenError, NotFoundError } from '@/lib/api-error';

export const PATCH = withErrorHandler(async (req, { params, session, orgId, orgRole }) => {
  const { id } = await params;
  const body = await req.json();
  const { title, description, skillTags, prLink, adminComment, projectId } = body;

  if (!orgId) throw new Error('No active organization');

  const existing = await db.query.breakthroughs.findFirst({
    where: and(eq(breakthroughs.id, id), eq(breakthroughs.organizationId, orgId)),
  });

  if (!existing) {
    throw new NotFoundError('Breakthrough not found');
  }

  const isOrgManager = orgRole === 'admin' || orgRole === 'owner';
  const isCreator = existing.userId === session!.user.id;

  if (!isOrgManager && !isCreator) {
    throw new ForbiddenError();
  }

  const updateData: Partial<typeof breakthroughs.$inferSelect> = {};
  if (isOrgManager) {
    if (adminComment !== undefined) updateData.adminComment = adminComment;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (skillTags !== undefined) updateData.skillTags = skillTags;
    if (prLink !== undefined) updateData.prLink = prLink;
    if (projectId !== undefined) updateData.projectId = projectId;
  } else if (isCreator) {
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (skillTags !== undefined) updateData.skillTags = skillTags;
    if (prLink !== undefined) updateData.prLink = prLink;
    if (projectId !== undefined) updateData.projectId = projectId;
  }

  const [updated] = await db
    .update(breakthroughs)
    .set(updateData)
    .where(eq(breakthroughs.id, id))
    .returning();

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandler(async (req, { params, session, orgId, orgRole }) => {
  const { id } = await params;

  if (!orgId) throw new Error('No active organization');

  const existing = await db.query.breakthroughs.findFirst({
    where: and(eq(breakthroughs.id, id), eq(breakthroughs.organizationId, orgId)),
  });

  if (!existing) {
    throw new NotFoundError('Breakthrough not found');
  }

  const isOrgManager = orgRole === 'admin' || orgRole === 'owner';
  const isCreator = existing.userId === session!.user.id;

  if (!isOrgManager && !isCreator) {
    throw new ForbiddenError();
  }

  await db.delete(breakthroughs).where(eq(breakthroughs.id, id));

  return NextResponse.json({ success: true });
});
