'use client';

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string; details?: unknown };

/**
 * Where the API lives. Empty (the default) means "same origin as this page",
 * which is how a single Next.js process serves both the UI and `/api/*`.
 *
 * Set NEXT_PUBLIC_API_BASE when the API runs as a separate instance on another
 * port — e.g. API on :2442 and the web UI on :2552. Cookies are scoped per
 * host and ignore the port, so the session still works across the two.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '');

function resolveUrl(url: string) {
  return API_BASE && url.startsWith('/api') ? `${API_BASE}${url}` : url;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Thin wrapper over fetch that unwraps the `{ success, data }` envelope. */
export async function api<T = unknown>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(resolveUrl(url), {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: 'no-store',
    // Needed when the API is a different origin (split-port deployments).
    credentials: 'include',
  });

  let payload: ApiResult<T> | null = null;
  try {
    payload = (await res.json()) as ApiResult<T>;
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok || !payload?.success) {
    const message = payload && 'error' in payload ? payload.error : `Request failed (${res.status})`;
    const details = payload && 'details' in payload ? payload.details : undefined;
    throw new ApiClientError(message, res.status, details);
  }

  return payload.data;
}

export const apiGet = <T,>(url: string) => api<T>(url);
export const apiPost = <T,>(url: string, json: unknown) => api<T>(url, { method: 'POST', json });
export const apiPatch = <T,>(url: string, json: unknown) => api<T>(url, { method: 'PATCH', json });
export const apiDelete = <T,>(url: string) => api<T>(url, { method: 'DELETE' });

/** Turns a flat params object into a query string, dropping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'ALL') sp.set(k, String(v));
  });
  const str = sp.toString();
  return str ? `?${str}` : '';
}

/** Flattens Zod issue arrays into a field → message map for forms. */
export function fieldErrors(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(
    details
      .filter((d): d is { path: string; message: string } => !!d && typeof d === 'object' && 'path' in d)
      .map((d) => [d.path, d.message]),
  );
}
