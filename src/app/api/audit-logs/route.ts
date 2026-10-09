import { ok, pagination, route, searchParams } from '@/lib/api';
import AuditLog from '@/models/AuditLog';

export const GET = route(
  async ({ req }) => {
    const { page, limit, skip } = pagination(req, 30);
    const sp = searchParams(req);

    const filter: Record<string, unknown> = {};
    const action = sp.get('action');
    if (action && action !== 'ALL') filter.action = action;
    const entity = sp.get('entity');
    if (entity && entity !== 'ALL') filter.entity = entity;
    const actor = sp.get('actor');
    if (actor) filter.actor = actor;

    const [items, total, actions, entities] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
      AuditLog.distinct('action'),
      AuditLog.distinct('entity'),
    ]);

    return ok({
      items,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      facets: { actions, entities },
    });
  },
  { permission: 'audit:view' },
);
