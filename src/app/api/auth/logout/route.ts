import { ok, route } from '@/lib/api';
import { clearSessionCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const POST = route(async ({ req, user }) => {
  await clearSessionCookie();
  await logAudit({
    actor: user,
    action: 'LOGOUT',
    entity: 'Auth',
    entityId: user?.id,
    summary: 'Signed out',
    req,
  });
  return ok({ signedOut: true });
}, { public: true });
