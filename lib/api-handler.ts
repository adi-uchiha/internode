import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from './auth';
import { Session } from './auth-types';
import { ApiError, ValidationError } from './api-error';
import { members } from '@/db/schema';
import { type InferSelectModel } from 'drizzle-orm';

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

        const memberData = await db.query.members.findFirst({
          where: and(eq(members.userId, session.user.id), eq(members.organizationId, orgId)),
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
          session: session as Session,
          orgId: session?.session.activeOrganizationId || undefined,
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
