import { ok, pagination, parseBody, route, searchParams } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { serviceOrderSchema } from '@/lib/validators';
import { generateCode } from '@/lib/utils';
import Part from '@/models/Part';
import ServiceOrder from '@/models/ServiceOrder';

export const GET = route(
  async ({ req, user }) => {
    const { page, limit, skip } = pagination(req);
    const sp = searchParams(req);

    const filter: Record<string, unknown> = {};
    const status = sp.get('status');
    if (status && status !== 'ALL') filter.status = status;
    const priority = sp.get('priority');
    if (priority && priority !== 'ALL') filter.priority = priority;
    const customer = sp.get('customer');
    if (customer) filter.customer = customer;
    const q = sp.get('q')?.trim();
    if (q) filter.code = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // Technicians only ever see their own bay work.
    if (user.role === 'TECHNICIAN' || sp.get('mine') === 'true') {
      filter.technicians = user.id;
    }

    const boardMode = sp.get('board') === 'true';
    const effectiveLimit = boardMode ? 200 : limit;

    const [items, total] = await Promise.all([
      ServiceOrder.find(filter)
        .populate('customer', 'name phone code')
        .populate('vehicle', 'registrationNumber make model year')
        .populate('technicians', 'name')
        .sort({ createdAt: -1 })
        .skip(boardMode ? 0 : skip)
        .limit(effectiveLimit)
        .lean(),
      ServiceOrder.countDocuments(filter),
    ]);

    return ok({
      items,
      total,
      page,
      limit: effectiveLimit,
      pages: Math.max(1, Math.ceil(total / effectiveLimit)),
    });
  },
  { permission: 'order:view' },
);

export const POST = route(
  async ({ req, user }) => {
    const payload = await parseBody(req, serviceOrderSchema);

    const order = await ServiceOrder.create({
      ...payload,
      code: generateCode('JOB'),
      appointment: payload.appointment || null,
      promisedAt: payload.promisedAt ? new Date(payload.promisedAt) : undefined,
      createdBy: user.id,
      workLog: [
        {
          at: new Date(),
          by: user.id,
          byName: user.name,
          status: payload.status ?? 'OPEN',
          note: 'Job card created',
        },
      ],
    });

    // Reserve the parts that were listed up front.
    for (const line of payload.parts ?? []) {
      if (line.part) {
        await Part.findByIdAndUpdate(line.part, { $inc: { stockQty: -line.qty } });
      }
    }

    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: 'ServiceOrder',
      entityId: String(order._id),
      summary: `Created job card ${order.code}`,
      req,
    });

    return ok(order, { status: 201 });
  },
  { permission: 'order:create' },
);
