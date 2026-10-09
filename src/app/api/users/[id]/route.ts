import { ApiError, ok, parseBody, route } from '@/lib/api';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { canManageUserWithRole } from '@/lib/rbac';
import { userUpdateSchema } from '@/lib/validators';
import { ROLES, type Role } from '@/lib/constants';
import User from '@/models/User';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(
  async ({ ctx }) => {
    const { id } = await ctx.params;
    const doc = await User.findById(id).populate('customer', 'name code phone').lean();
    if (!doc) throw new ApiError('User not found', 404);
    return ok(doc);
  },
  { permission: 'user:view' },
);

export const PATCH = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const payload = await parseBody(req, userUpdateSchema);

    const doc = await User.findById(id).select('+passwordHash');
    if (!doc) throw new ApiError('User not found', 404);

    if (!canManageUserWithRole(user.role, doc.role)) {
      throw new ApiError('You cannot modify this account', 403);
    }
    if (payload.role && !canManageUserWithRole(user.role, payload.role as Role)) {
      throw new ApiError(`You cannot grant the ${payload.role} role`, 403);
    }
    // Never let the last super admin be demoted or locked out.
    if (doc.role === ROLES.SUPER_ADMIN && (payload.role || payload.isActive === false)) {
      const supers = await User.countDocuments({ role: ROLES.SUPER_ADMIN, isActive: true });
      if (supers <= 1) throw new ApiError('The last active super admin must remain active', 400);
    }

    if (payload.name !== undefined) doc.name = payload.name;
    if (payload.email !== undefined) doc.email = payload.email.toLowerCase();
    if (payload.phone !== undefined) doc.phone = payload.phone;
    if (payload.role !== undefined) doc.role = payload.role as Role;
    if (payload.isActive !== undefined) doc.isActive = payload.isActive;
    if (payload.technician !== undefined) {
      doc.technician = { ...(doc.technician ?? {}), ...payload.technician } as typeof doc.technician;
    }
    if (payload.password) doc.passwordHash = await hashPassword(payload.password);

    await doc.save();

    await logAudit({
      actor: user,
      action: payload.password ? 'PASSWORD_RESET' : 'UPDATE',
      entity: 'User',
      entityId: id,
      summary: payload.password
        ? `Reset password for ${doc.name}`
        : `Updated account ${doc.name}`,
      req,
    });

    const json = doc.toObject();
    delete (json as { passwordHash?: string }).passwordHash;
    return ok(json);
  },
  { permission: 'user:update' },
);

export const DELETE = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    if (id === user.id) throw new ApiError('You cannot delete your own account', 400);

    const doc = await User.findById(id);
    if (!doc) throw new ApiError('User not found', 404);
    if (!canManageUserWithRole(user.role, doc.role)) {
      throw new ApiError('You cannot delete this account', 403);
    }
    if (doc.role === ROLES.SUPER_ADMIN) {
      const supers = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
      if (supers <= 1) throw new ApiError('The last super admin cannot be deleted', 400);
    }

    await doc.deleteOne();

    await logAudit({
      actor: user,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      summary: `Deleted account ${doc.name} (${doc.role})`,
      req,
    });

    return ok({ deleted: true });
  },
  { permission: 'user:delete' },
);
