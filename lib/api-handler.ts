import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './auth';
import { Session } from './auth-types';
import { ApiError, ValidationError } from './api-error';
import { members } from '@/db/schema';
import { type InferSelectModel } from 'drizzle-orm';
import { CRON_SECRET } from './env';

type HandlerContext = {
  params: Promise<Record<string, string>>;
  session?: Session;
  orgId?: string;
  orgRole?: import('./org-utils').OrgRole;
  member?: InferSelectModel<typeof members>;
};

type ApiHandler = (req: Request, context: HandlerContext) => Promise<Response> | Response;

interface HandlerOptions {
  requiredRole?: string | string[];
  skipAuth?: boolean;
}

export function withErrorHandler(handler: ApiHandler, options: HandlerOptions = {}) {
  return async (req: Request, context: { params: Promise<Record<string, string>> }) => {
    try {
      let session: Session | null = null;
      let userId: string | null = null;
      let orgId: string | null = null;

      if (!options.skipAuth) {
        const reqHeaders = await headers();
        const authHeader = req.headers.get('authorization') || reqHeaders.get('authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const { createHash } = await import('crypto');
          const rawToken = authHeader.replace('Bearer ', '');
          const hashedToken = createHash('sha256').update(rawToken).digest('hex');

          const { db } = await import('@/db');
          const { apiKeys, users } = await import('@/db/schema');
          const { eq } = await import('drizzle-orm');

          const apiKeyData = await db.query.apiKeys.findFirst({
            where: eq(apiKeys.id, hashedToken),
          });

          if (!apiKeyData) {
            throw new ApiError('Invalid API Key', 401, 'invalid_key');
          }

          userId = apiKeyData.userId;
          orgId = apiKeyData.organizationId;

          // Track usage (fire-and-forget but awaited for safety in core handler)
          void db
            .update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, apiKeyData.id))
            .execute();

          // Fetch user data to synthesize a Session object
          const userData = await db.query.users.findFirst({
            where: eq(users.id, userId),
          });

          if (!userData) {
            throw new ApiError('User not found for API key', 404, 'user_not_found');
          }

          session = {
            session: {
              id: 'api-key-session',
              userId: userId,
              activeOrganizationId: orgId,
              createdAt: new Date(),
              updatedAt: new Date(),
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
              ipAddress: null,
              userAgent: null,
            },
            user: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              emailVerified: userData.emailVerified,
              image: userData.image,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt,
              notificationSettings: userData.notificationSettings,
            },
          } as unknown as Session;
        } else {
          const authSession = await auth.api.getSession({
            headers: reqHeaders,
          });

          if (!authSession) {
            throw new ApiError('Unauthorized', 401, 'unauthorized');
          }

          session = authSession as Session;
          userId = session.user.id;
          orgId = session.session.activeOrganizationId || null;

          if (!orgId) {
            throw new ApiError('No active organization', 403, 'no_active_org');
          }
        }

        // Fetch user context from members table
        const { db } = await import('@/db');
        const { members } = await import('@/db/schema');
        const { and, eq } = await import('drizzle-orm');

        const memberData = await db.query.members.findFirst({
          where: and(eq(members.userId, userId), eq(members.organizationId, orgId)),
        });

        if (!memberData) {
          throw new ApiError('Not a member of this organization', 403, 'not_a_member');
        }

        const { isAtLeast } = await import('./rbac');

        if (options.requiredRole) {
          const userRole = memberData.role as import('./org-utils').OrgRole;
          const roles = Array.isArray(options.requiredRole)
            ? (options.requiredRole as import('./org-utils').OrgRole[])
            : [options.requiredRole as import('./org-utils').OrgRole];

          const hasAccess = roles.some((reqRole) => isAtLeast(userRole, reqRole));

          if (!hasAccess) {
            throw new ApiError('Forbidden: Insufficient organization privileges', 403, 'forbidden');
          }
        }

        return await handler(req, {
          params: context.params,
          session: session || undefined,
          orgId: orgId || undefined,
          orgRole: (memberData.role as import('./org-utils').OrgRole) || undefined,
          member: memberData as InferSelectModel<typeof members>,
        });
      }

      const safeSession = session as Session | null;

      return await handler(req, {
        params: context.params,
        session: safeSession || undefined,
        orgId: safeSession?.session?.activeOrganizationId || undefined,
      });
    } catch (error) {
      console.error('[API_ERROR]', error);

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.errorCode,
            details: error instanceof ValidationError ? error.errors : undefined,
          },
          { status: error.statusCode }
        );
      }

      // Handle other known error types if necessary, otherwise generic 500
      const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';

      return NextResponse.json(
        {
          error: errorMessage,
          code: 'internal_server_error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Wraps a cron-triggered API endpoint with bearer-token authentication.
 *
 * Security: validates the Authorization header against CRON_SECRET.
 * Returns 401 if missing or incorrect.
 * Returns 500 with structured error on handler exception.
 *
 * Usage:
 *   export const GET = withCronAuth(async (req) => {
 *     // ... cron logic
 *     return NextResponse.json({ success: true, sent: N });
 *   });
 */
export function withCronAuth(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

    if (!token || token !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'invalid_cron_token' },
        { status: 401 }
      );
    }

    try {
      return await handler(req);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[CronJob] Unhandled error:', { message: error.message, stack: error.stack });
      return NextResponse.json(
        { error: 'Internal Server Error', code: 'internal_server_error' },
        { status: 500 }
      );
    }
  };
}
