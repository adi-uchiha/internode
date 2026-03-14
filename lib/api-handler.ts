import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './auth';
import { Session } from './auth-types';
import { ApiError, ValidationError } from './api-error';

type HandlerContext = {
  params: Promise<Record<string, string>>;
  session?: Session;
  orgId?: string;
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

      if (!options.skipAuth) {
        const authSession = await auth.api.getSession({
          headers: await headers(),
        });

        if (!authSession) {
          throw new ApiError('Unauthorized', 401, 'unauthorized');
        }

        session = authSession as Session;

        const orgId = session.session.activeOrganizationId;
        if (!orgId) {
          throw new ApiError('No active organization', 403, 'no_active_org');
        }

        // Fetch user context from members table
        const { db } = await import('@/db');
        const { members } = await import('@/db/schema');
        const { and, eq } = await import('drizzle-orm');

        const member = await db.query.members.findFirst({
          where: and(eq(members.userId, session.user.id), eq(members.organizationId, orgId)),
        });

        if (!member) {
          throw new ApiError('Not a member of this organization', 403, 'not_a_member');
        }

        const ROLE_LEVELS: Record<string, number> = {
          owner: 100,
          admin: 50,
          member: 10,
        };

        if (options.requiredRole) {
          const userRole = member.role;
          const roles = Array.isArray(options.requiredRole)
            ? options.requiredRole
            : [options.requiredRole];

          const hasAccess = roles.some((reqRole) => {
            const userRoleLevel = ROLE_LEVELS[userRole] || 0;
            const reqRoleLevel = ROLE_LEVELS[reqRole] || 0;
            return userRoleLevel >= reqRoleLevel;
          });

          if (!hasAccess) {
            throw new ApiError('Forbidden: Insufficient organization privileges', 403, 'forbidden');
          }
        }
      }

      return await handler(req, {
        params: context.params,
        session: session as Session,
        orgId: session?.session.activeOrganizationId || undefined,
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

      // Generic error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          code: 'internal_server_error',
        },
        { status: 500 }
      );
    }
  };
}
