import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { ApiError, ValidationError } from './api-error';

type HandlerContext = {
  params: Promise<Record<string, string>>;
  session?: {
    user: {
      id: string;
      role: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
};

type ApiHandler = (req: Request, context: HandlerContext) => Promise<Response> | Response;

interface HandlerOptions {
  requiredRole?: string | string[];
  skipAuth?: boolean;
}

export function withErrorHandler(handler: ApiHandler, options: HandlerOptions = {}) {
  return async (req: Request, context: { params: Promise<unknown> }) => {
    try {
      let session = null;

      if (!options.skipAuth) {
        session = await auth.api.getSession({
          headers: await headers(),
        });

        if (!session) {
          throw new ApiError('Unauthorized', 401, 'unauthorized');
        }

        if (options.requiredRole) {
          const roles = Array.isArray(options.requiredRole)
            ? options.requiredRole
            : [options.requiredRole];

          if (!roles.includes(session.user.role)) {
            throw new ApiError('Forbidden', 403, 'forbidden');
          }
        }
      }

      return await handler(req, { params: context.params, session } as HandlerContext);
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
