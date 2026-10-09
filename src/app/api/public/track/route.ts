import { ApiError, ok, route, searchParams } from '@/lib/api';
import Appointment from '@/models/Appointment';
import ServiceOrder from '@/models/ServiceOrder';

type Lean = Record<string, unknown> & { _id: unknown };

/**
 * Public status lookup by booking code (APT-xxxxxx) or job-card code
 * (JOB-xxxxxx). Returns only what is safe to show without a login.
 */
export const GET = route(
  async ({ req }) => {
    const code = searchParams(req).get('code')?.trim().toUpperCase();
    if (!code || code.length < 6) throw new ApiError('Enter your booking or job card code', 422);

    if (code.startsWith('JOB')) {
      const order = (await ServiceOrder.findOne({ code })
        .populate('vehicle', 'registrationNumber make model')
        .populate('customer', 'name')
        .populate('technicians', 'name')
        .lean()) as Lean | null;
      if (!order) throw new ApiError('No job card found with that code', 404);

      return ok({
        kind: 'JOB' as const,
        code,
        status: order.status,
        priority: order.priority,
        vehicle: order.vehicle,
        customerName: (order.customer as { name?: string })?.name,
        items: (order.items as { name: string }[]).map((i) => i.name),
        promisedAt: order.promisedAt,
        startedAt: order.startedAt,
        completedAt: order.completedAt,
        deliveredAt: order.deliveredAt,
        grandTotal: order.grandTotal,
        timeline: (order.workLog as { at: Date; status?: string; note: string }[]).map((w) => ({
          at: w.at,
          status: w.status,
          note: w.note,
        })),
      });
    }

    const appointment = (await Appointment.findOne({ code })
      .populate('vehicle', 'registrationNumber make model')
      .populate('customer', 'name')
      .populate('services', 'name')
      .populate('serviceOrder', 'code status')
      .lean()) as Lean | null;
    if (!appointment) throw new ApiError('No booking found with that code', 404);

    return ok({
      kind: 'APPOINTMENT' as const,
      code,
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
      slot: appointment.slot,
      vehicle: appointment.vehicle,
      customerName: (appointment.customer as { name?: string })?.name,
      services: (appointment.services as { name: string }[]).map((s) => s.name),
      estimatedCost: appointment.estimatedCost,
      jobCard: appointment.serviceOrder,
      timeline: (appointment.statusHistory as { at: Date; status: string; note?: string }[]).map(
        (h) => ({ at: h.at, status: h.status, note: h.note }),
      ),
    });
  },
  { public: true },
);
