import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { Logger } from '@/lib/utils';
import type { JwtPayload } from '@/types';

export type ApiHandler<TParams = unknown> = (
  request: NextRequest,
  user: JwtPayload,
  params: TParams,
) => Promise<Response>;

export type PublicApiHandler<TParams = unknown> = (
  request: NextRequest,
  params: TParams,
) => Promise<Response>;

export interface WithApiOptions {
  /** Require a specific user level (1 = owner, 2 = admin, 3 = reseller), or an array of allowed levels. */
  level?: number | number[];
  /** JSON body to return with the 401 response when unauthenticated (defaults to `{ error: 'Unauthorized' }`). */
  unauthorizedBody?: Record<string, unknown>;
}

function handleError(request: NextRequest, error: unknown, user?: JwtPayload): NextResponse {
  Logger.error('API error', {
    path: request.nextUrl.pathname,
    ...(user ? { user: user.username } : {}),
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/**
 * Wraps an authenticated route handler with:
 * - JWT auth guard (401 when unauthenticated)
 * - Optional level check (401 when the user lacks the required level)
 * - Centralized try/catch → structured logging + 500 response
 *
 * Usage:
 *   export const GET = withApi(async (request, user) => { ... });
 *   export const GET = withApi(async (request, user) => { ... }, { level: 1 });
 *   export const GET = withApi(async (request, user, { id }) => { ... }, { level: 1 }); // dynamic routes
 */
export function withApi<TParams = unknown>(
  handler: ApiHandler<TParams>,
  options: WithApiOptions = {},
) {
  return async (request: NextRequest, context?: { params: Promise<TParams> }) => {
    const user = await authenticate(request);
    const allowedLevels =
      options.level === undefined
        ? null
        : Array.isArray(options.level)
          ? options.level
          : [options.level];

    if (!user || (allowedLevels !== null && !allowedLevels.includes(user.level))) {
      return NextResponse.json(options.unauthorizedBody ?? { error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const params = (await context?.params) as TParams;
      return await handler(request, user, params);
    } catch (error) {
      return handleError(request, error, user);
    }
  };
}

/**
 * Wraps a public (unauthenticated) route handler with centralized
 * try/catch → structured logging + 500 response.
 *
 * Usage:
 *   export const POST = withPublicApi(async (request) => { ... });
 */
export function withPublicApi<TParams = unknown>(
  handler: PublicApiHandler<TParams>,
) {
  return async (request: NextRequest, context?: { params: Promise<TParams> }) => {
    try {
      const params = (await context?.params) as TParams;
      return await handler(request, params);
    } catch (error) {
      return handleError(request, error);
    }
  };
}
