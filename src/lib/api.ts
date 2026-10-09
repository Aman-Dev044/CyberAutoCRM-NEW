import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { connectDB } from './db';
import { getSession, type SessionUser } from './auth';
import { can, type Permission } from './rbac';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

type RouteHandler<Ctx> = (args: { req: Request; ctx: Ctx; user: SessionUser }) => Promise<Response>;

type RouteOptions = {
  permission?: Permission;
  roles?: string[];
  public?: boolean;
};

/**
 * Wraps a route handler: opens the DB connection, enforces auth + permission,
 * and converts thrown errors into predictable JSON responses.
 */
export function route<Ctx = unknown>(handler: RouteHandler<Ctx>, options: RouteOptions = {}) {
  return async (req: Request, ctx: Ctx) => {
    try {
      await connectDB();
      const user = await getSession();

      if (!options.public) {
        if (!user) throw new ApiError('Authentication required', 401);
        if (options.roles && !options.roles.includes(user.role)) {
          throw new ApiError('You do not have access to this resource', 403);
        }
        if (options.permission && !can(user.role, options.permission)) {
          throw new ApiError('Insufficient permissions', 403);
        }
      }

      return await handler({ req, ctx, user: user as SessionUser });
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, err.status, err.details);
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        return fail('Validation failed', 422, details);
      }
      const e = err as { code?: number; keyValue?: Record<string, unknown>; message?: string };
      if (e?.code === 11000) {
        const field = Object.keys(e.keyValue ?? {})[0] ?? 'value';
        return fail('A record with this ' + field + ' already exists', 409);
      }
      console.error('[api]', err);
      return fail(e?.message || 'Something went wrong', 500);
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError('Request body must be valid JSON', 400);
  }
  return schema.parse(json);
}

export function searchParams(req: Request) {
  return new URL(req.url).searchParams;
}

export function pagination(req: Request, defaultLimit = 20) {
  const sp = searchParams(req);
  const page = Math.max(1, Number(sp.get('page') ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? defaultLimit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Escapes a user-supplied search term before it goes into a RegExp. */
export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
