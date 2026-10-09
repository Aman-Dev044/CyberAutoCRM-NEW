import { z } from 'zod';
import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { ROLES } from '@/lib/constants';
import { generateCode } from '@/lib/utils';
import Appointment from '@/models/Appointment';
import Service from '@/models/Service';
import Vehicle from '@/models/Vehicle';

const schema = z.object({
  vehicle: z.string().regex(/^[0-9a-fA-F]{24}$/),
  services: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1, 'Pick at least one service'),
  scheduledAt: z.string().min(4),
  slot: z.string().min(4),
  concern: z.string().max(2000).optional().or(z.literal('')),
  pickupRequired: z.boolean().optional(),
  pickupAddress: z.string().max(300).optional().or(z.literal('')),
});

/** Customer self-service booking against one of their own vehicles. */
export const POST = route(
  async ({ req, user }) => {
    if (!user.customerId) throw new ApiError('No customer record linked to this account', 400);
    const payload = await parseBody(req, schema);

    const vehicle = await Vehicle.findOne({ _id: payload.vehicle, customer: user.customerId });
    if (!vehicle) throw new ApiError('That vehicle is not on your account', 403);

    const services = await Service.find({ _id: { $in: payload.services }, isActive: true })
      .select('basePrice')
      .lean();
    if (!services.length) throw new ApiError('Pick at least one available service', 422);

    const appointment = await Appointment.create({
      code: generateCode('APT'),
      customer: user.customerId,
      vehicle: vehicle._id,
      services: services.map((s) => s._id),
      scheduledAt: new Date(payload.scheduledAt),
      slot: payload.slot,
      status: 'PENDING',
      source: 'ONLINE',
      estimatedCost: services.reduce((sum, s) => sum + (s.basePrice ?? 0), 0),
      concern: payload.concern,
      pickupRequired: payload.pickupRequired ?? false,
      pickupAddress: payload.pickupAddress,
      createdBy: user.id,
      statusHistory: [{ status: 'PENDING', at: new Date(), by: user.id, note: 'Booked from portal' }],
    });

    await Service.updateMany({ _id: { $in: payload.services } }, { $inc: { bookingCount: 1 } });

    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: 'Appointment',
      entityId: String(appointment._id),
      summary: `Portal booking ${appointment.code}`,
      req,
    });

    return ok({ code: appointment.code, id: String(appointment._id) }, { status: 201 });
  },
  { roles: [ROLES.CUSTOMER] },
);
