import { z } from 'zod';
import { ApiError, ok, parseBody, route } from '@/lib/api';
import { signSession, setSessionCookie } from '@/lib/auth';
import { ROLE_PERMISSIONS } from '@/lib/rbac';
import Customer from '@/models/Customer';
import User from '@/models/User';

export const GET = route(async ({ user }) => {
  const doc = await User.findById(user.id).lean();
  if (!doc) throw new ApiError('Account not found', 404);

  return ok({
    user: {
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      role: doc.role,
      avatarUrl: doc.avatarUrl,
      customerId: doc.customer ? String(doc.customer) : null,
      lastLoginAt: doc.lastLoginAt,
      technician: doc.technician,
    },
    permissions: ROLE_PERMISSIONS[doc.role] ?? [],
  });
});

const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  avatarUrl: z.string().max(400).optional().or(z.literal('')),
});

export const PATCH = route(async ({ req, user }) => {
  const payload = await parseBody(req, profileSchema);
  const doc = await User.findById(user.id);
  if (!doc) throw new ApiError('Account not found', 404);

  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.phone !== undefined) doc.phone = payload.phone;
  if (payload.avatarUrl !== undefined) doc.avatarUrl = payload.avatarUrl;
  await doc.save();

  // Keep the linked CRM customer record in step with the account.
  if (doc.customer) {
    await Customer.findByIdAndUpdate(doc.customer, {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.phone ? { phone: payload.phone } : {}),
    });
  }

  // Re-issue the cookie so the header shows the new name immediately.
  await setSessionCookie(
    await signSession({
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      customerId: doc.customer ? String(doc.customer) : null,
      avatarUrl: doc.avatarUrl ?? null,
    }),
  );

  return ok({ updated: true });
});
