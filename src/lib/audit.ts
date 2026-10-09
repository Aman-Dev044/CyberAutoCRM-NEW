import 'server-only';
import AuditLog from '@/models/AuditLog';
import type { SessionUser } from './auth';

type AuditInput = {
  actor?: SessionUser | null;
  action: string;
  entity: string;
  entityId?: string;
  summary?: string;
  meta?: Record<string, unknown>;
  req?: Request;
};

function clientIp(req?: Request) {
  if (!req) return undefined;
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;
}

/**
 * Fire-and-forget audit trail. Never let logging break the actual request,
 * so failures are swallowed with a console warning.
 */
export async function logAudit(input: AuditInput) {
  try {
    await AuditLog.create({
      actor: input.actor?.id ?? null,
      actorName: input.actor?.name ?? 'System',
      actorRole: input.actor?.role ?? 'SYSTEM',
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      summary: input.summary,
      meta: input.meta,
      ip: clientIp(input.req),
    });
  } catch (err) {
    console.warn('[audit] failed to write log', err);
  }
}
