import { ok, pagination, parseBody, route, searchParams } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { invoiceSchema } from '@/lib/validators';
import Invoice from '@/models/Invoice';
import Setting from '@/models/Setting';

export const GET = route(
  async ({ req }) => {
    const { page, limit, skip } = pagination(req);
    const sp = searchParams(req);

    const filter: Record<string, unknown> = {};
    const status = sp.get('status');
    if (status && status !== 'ALL') filter.status = status;
    const customer = sp.get('customer');
    if (customer) filter.customer = customer;
    const q = sp.get('q')?.trim();
    if (q) filter.number = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [items, total, totals] = await Promise.all([
      Invoice.find(filter)
        .populate('customer', 'name phone code')
        .populate('vehicle', 'registrationNumber make model')
        .populate('serviceOrder', 'code')
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
      Invoice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            billed: { $sum: '$total' },
            collected: { $sum: '$amountPaid' },
            outstanding: { $sum: '$balance' },
          },
        },
      ]),
    ]);

    return ok({
      items,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      summary: totals[0] ?? { billed: 0, collected: 0, outstanding: 0 },
    });
  },
  { permission: 'invoice:view' },
);

export const POST = route(
  async ({ req, user }) => {
    const payload = await parseBody(req, invoiceSchema);

    const settings = await Setting.findOne({ key: 'global' }).lean();
    const prefix = settings?.finance?.invoicePrefix ?? 'INV';
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({ number: new RegExp(`^${prefix}-${year}-`) });

    const invoice = await Invoice.create({
      ...payload,
      number: `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`,
      vehicle: payload.vehicle || null,
      serviceOrder: payload.serviceOrder || null,
      dueDate: payload.dueDate
        ? new Date(payload.dueDate)
        : new Date(Date.now() + (settings?.finance?.paymentTermsDays ?? 7) * 86400000),
      status: payload.status ?? 'SENT',
      createdBy: user.id,
    });

    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: String(invoice._id),
      summary: `Created invoice ${invoice.number}`,
      req,
    });

    return ok(invoice, { status: 201 });
  },
  { permission: 'invoice:create' },
);
