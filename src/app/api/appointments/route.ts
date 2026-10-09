import { escapeRegex, ok, pagination, parseBody, route, searchParams } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { appointmentSchema } from '@/lib/validators';
import { generateCode } from '@/lib/utils';
import Appointment from '@/models/Appointment';
import Service from '@/models/Service';

export const GET = route(
  async ({ req }) => {
    const { page, limit, skip } = pagination(req);
    const sp = searchParams(req);

    const filter: Record<string, unknown> = {};
    const status = sp.get('status');
    if (status && status !== 'ALL') filter.status = status;
    const customer = sp.get('customer');
    if (customer) filter.customer = customer;
    const technician = sp.get('technician');
    if (technician) filter.assignedTechnician = technician;
    const q = sp.get('q')?.trim();
    if (q) filter.code = new RegExp(escapeRegex(q), 'i');

    const from = sp.get('from');
    const to = sp.get('to');
    if (from || to) {
      filter.scheduledAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(`${to}T23:59:59`) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .populate('customer', 'name phone email code')
        .populate('vehicle', 'registrationNumber make model year')
        .populate('services', 'name basePrice estimatedHours')
        .populate('assignedTechnician', 'name')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return ok({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  },
  { permission: 'appointment:view' },
);

export const POST = route(
  async ({ req, user }) => {
    const payload = await parseBody(req, appointmentSchema);

    const services = await Service.find({ _id: { $in: payload.services } })
      .select('basePrice')
      .lean();
    const estimatedCost = services.reduce((sum, s) => sum + (s.basePrice ?? 0), 0);

    const appointment = await Appointment.create({
      ...payload,
      code: generateCode('APT'),
      scheduledAt: new Date(payload.scheduledAt),
      estimatedCost,
      source: payload.source ?? 'ADMIN',
      status: payload.status ?? 'CONFIRMED',
      assignedTechnician: payload.assignedTechnician || null,
      createdBy: user.id,
      statusHistory: [
        { status: payload.status ?? 'CONFIRMED', at: new Date(), by: user.id, note: 'Created' },
      ],
    });

    await Service.updateMany({ _id: { $in: payload.services } }, { $inc: { bookingCount: 1 } });

    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: String(appointment._id),
      summary: `Booked appointment ${appointment.code}`,
      req,
    });

    return ok(appointment, { status: 201 });
  },
  { permission: 'appointment:create' },
);
