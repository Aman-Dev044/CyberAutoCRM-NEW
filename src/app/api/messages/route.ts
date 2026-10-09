import { ok, pagination, route, searchParams } from '@/lib/api';
import ContactMessage from '@/models/ContactMessage';

export const GET = route(
  async ({ req }) => {
    const { page, limit, skip } = pagination(req);
    const sp = searchParams(req);

    const filter: Record<string, unknown> = {};
    const status = sp.get('status');
    if (status && status !== 'ALL') filter.status = status;

    const [items, total, unread] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ status: 'NEW' }),
    ]);

    return ok({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), unread });
  },
  { permission: 'message:view' },
);
