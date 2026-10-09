import { ApiError, ok, parseBody, route } from '@/lib/api';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { changePasswordSchema } from '@/lib/validators';
import User from '@/models/User';

export const PATCH = route(async ({ req, user }) => {
  const { currentPassword, newPassword } = await parseBody(req, changePasswordSchema);

  const doc = await User.findById(user.id).select('+passwordHash');
  if (!doc) throw new ApiError('Account not found', 404);
  if (!(await verifyPassword(currentPassword, doc.passwordHash))) {
    throw new ApiError('Your current password is incorrect', 400);
  }

  doc.passwordHash = await hashPassword(newPassword);
  await doc.save();

  await logAudit({
    actor: user,
    action: 'PASSWORD_CHANGE',
    entity: 'Auth',
    entityId: user.id,
    summary: 'Changed own password',
    req,
  });

  return ok({ updated: true });
});
