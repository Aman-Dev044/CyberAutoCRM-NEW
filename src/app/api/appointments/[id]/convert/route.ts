import { ApiError, ok, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { generateCode } from '@/lib/utils';
import Appointment from '@/models/Appointment';
import ServiceOrder from '@/models/ServiceOrder';
import Vehicle from '@/models/Vehicle';

type Ctx = { params: Promise<{ id: string }> };

type PopulatedService = { _id: unknown; name: string; basePrice: number; estimatedHours: number };

/** Turns a confirmed appointment into an open job card on the workshop board. */
export const POST = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;

    const appointment = await Appointment.findById(id).populate(
      'services',
      'name basePrice estimatedHours',
    );
    if (!appointment) throw new ApiError('Appointment not found', 404);
    if (appointment.serviceOrder) {
      throw new ApiError('A job card already exists for this appointment', 409);
    }
    if (appointment.status === 'CANCELLED') {
      throw new ApiError('Cancelled appointments cannot be converted', 400);
    }

    const vehicle = await Vehicle.findById(appointment.vehicle).lean();

    const order = await ServiceOrder.create({
      code: generateCode('JOB'),
      customer: appointment.customer,
      vehicle: appointment.vehicle,
      appointment: appointment._id,
      status: 'OPEN',
      priority: 'NORMAL',
      technicians: appointment.assignedTechnician ? [appointment.assignedTechnician] : [],
      items: (appointment.services as unknown as PopulatedService[]).map((s) => ({
        service: s._id,
        name: s.name,
        price: s.basePrice,
        hours: s.estimatedHours,
        qty: 1,
      })),
      complaint: appointment.concern,
      odometerIn: vehicle?.odometer ?? 0,
      createdBy: user.id,
      workLog: [
        {
          at: new Date(),
          by: user.id,
          byName: user.name,
          status: 'OPEN',
          note: `Job card opened from appointment ${appointment.code}`,
        },
      ],
    });

    appointment.serviceOrder = order._id;
    appointment.status = 'IN_PROGRESS';
    appointment.statusHistory.push({
      status: 'IN_PROGRESS',
      at: new Date(),
      by: user.id as unknown as typeof appointment.createdBy,
      note: `Converted to job card ${order.code}`,
    });
    await appointment.save();

    await logAudit({
      actor: user,
      action: 'CONVERT',
      entity: 'Appointment',
      entityId: id,
      summary: `Appointment ${appointment.code} → job card ${order.code}`,
      req,
    });

    return ok({ order }, { status: 201 });
  },
  { permission: 'order:create' },
);
