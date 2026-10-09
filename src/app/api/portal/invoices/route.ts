import { ApiError, ok, pagination, route } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import Invoice from '@/models/Invoice';

export const GET = route(
  async ({ req, user }) => {
    if (!user.customerId) throw new ApiError('No customer record linked to this account', 400);
    const { page, limit, skip } = pagination(req);

    const filter = { customer: user.customerId };
    const [items, total] = await Promise.all([
      Invoice.find(filter)
        .populate('vehicle', 'registrationNumber make model')
        .populate('serviceOrder', 'code')
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    return ok({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  },
  { roles: [ROLES.CUSTOMER] },
);
