import { NextResponse } from 'next/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { withErrorHandler } from '@/lib/api-handler';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const GET = withErrorHandler(async (req, { session, orgId }) => {
  // Only fetch keys for the current user in the current org
  const keys = await db.query.apiKeys.findMany({
    where: and(eq(apiKeys.organizationId, orgId!), eq(apiKeys.userId, session!.user.id)),
    orderBy: [desc(apiKeys.createdAt)],
  });

  return NextResponse.json(keys);
});

export const POST = withErrorHandler(async (req, { session, orgId }) => {
  const json = await req.json();
  const { name } = createKeySchema.parse(json);

  // Generate a cryptographically secure token
  const rawToken = 'in_' + randomBytes(28).toString('hex');
  const hashedToken = createHash('sha256').update(rawToken).digest('hex');
  const hint = rawToken.substring(0, 6) + '...' + rawToken.substring(rawToken.length - 4);

  const [newKey] = await db
    .insert(apiKeys)
    .values({
      id: hashedToken, // Only storing the irreversibly hashed token
      name,
      hint,
      organizationId: orgId!,
      userId: session!.user.id,
    })
    .returning();

  // We return the rawToken EXACTLY ONCE to the client for display.
  // We NEVER store it, and it can never be retrieved again.
  return NextResponse.json({ ...newKey, rawToken }, { status: 201 });
});

export const DELETE = withErrorHandler(async (req, { session, orgId }) => {
  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get('id');

  if (!keyId) {
    return NextResponse.json({ error: 'Missing key ID to revoke' }, { status: 400 });
  }

  // Ensure the user deleting the key actually owns it in this org
  const [deleted] = await db
    .delete(apiKeys)
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.organizationId, orgId!),
        eq(apiKeys.userId, session!.user.id)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Key not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
