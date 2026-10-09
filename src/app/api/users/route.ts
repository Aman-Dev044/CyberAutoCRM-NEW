import { ApiError, escapeRegex, ok, pagination, parseBody, route, searchParams } from '@/lib/api';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { canManageUserWithRole } from '@/lib/rbac';
import { userSchema } from '@/lib/validators';
import { ROLES, type Role } from '@/lib/constants';
import { generateCode } from '@/lib/utils';
import Customer from '@/models/Customer';
import User from '@/models/User';

export const GET = route(
  async ({ req }) => {
    const { page, limit, skip } = pagination(req);
    const sp = searchParams(req);

    const filter: Record<string, unknown> = {};
    const role = sp.get('role');
    if (role && role !== 'ALL') filter.role = role;
    const isActive = sp.get('isActive');
    if (isActive === 'true' || isActive === 'false') filter.isActive = isActive === 'true';
    const q = sp.get('q')?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const [items, total, roleCounts] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    return ok({
      items,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      roleCounts: Object.fromEntries(roleCounts.map((r) => [r._id, r.count])),
    });
  },
  { permission: 'user:view' },
);

export const POST = route(
  async ({ req, user }) => {
    const payload = await parseBody(req, userSchema);

    if (!canManageUserWithRole(user.role, payload.role as Role)) {
      throw new ApiError(`You cannot create a ${payload.role} account`, 403);
    }
    if (!payload.password) throw new ApiError('A password is required for new accounts', 422);
    if (await User.exists({ email: payload.email.toLowerCase() })) {
      throw new ApiError('An account with this email already exists', 409);
    }

    // Staff accounts carry no CRM customer record; customer logins always do.
    let customerId: string | null = null;
    if (payload.role === ROLES.CUSTOMER) {
      const customer = await Customer.create({
        code: generateCode('CUS'),
        name: payload.name,
        email: payload.email.toLowerCase(),
        phone: payload.phone || '0000000000',
        createdBy: user.id,
      });
      customerId = String(customer._id);
    }

    const created = await User.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash: await hashPassword(payload.password),
      phone: payload.phone,
      role: payload.role,
      isActive: payload.isActive ?? true,
      customer: customerId,
      technician: payload.role === ROLES.TECHNICIAN ? (payload.technician ?? {}) : undefined,
      createdBy: user.id,
    });

    if (customerId) await Customer.findByIdAndUpdate(customerId, { user: created._id });

    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: 'User',
      entityId: String(created._id),
      summary: `Created ${payload.role} account for ${payload.name}`,
      req,
    });

    const json = created.toObject();
    delete (json as { passwordHash?: string }).passwordHash;
    return ok(json, { status: 201 });
  },
  { permission: 'user:create' },
);
