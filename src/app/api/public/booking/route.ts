import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { publicBookingSchema } from '@/lib/validators';
import { generateCode } from '@/lib/utils';
import Appointment from '@/models/Appointment';
import Customer from '@/models/Customer';
import Service from '@/models/Service';
import Setting from '@/models/Setting';
import Vehicle from '@/models/Vehicle';

/**
 * Public booking: finds or creates the customer and vehicle, then books a
 * PENDING appointment the front desk confirms from the admin panel.
 */
export const POST = route(
  async ({ req, user }) => {
    const payload = await parseBody(req, publicBookingSchema);

    const scheduledAt = new Date(payload.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new ApiError('Pick a valid date', 422);

    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    if (dayEnd.getTime() < Date.now()) {
      throw new ApiError('Pick a date in the future', 422);
    }

    // Respect the configured daily capacity and stop double-booking a slot.
    const settings = await Setting.findOne({ key: 'global' }).lean();
    const maxDaily = settings?.operations?.maxDailyAppointments ?? 24;
    const bays = settings?.operations?.bayCount ?? 6;

    const [dayCount, slotCount] = await Promise.all([
      Appointment.countDocuments({
        scheduledAt: { $gte: dayStart, $lt: dayEnd },
        status: { $nin: ['CANCELLED', 'NO_SHOW'] },
      }),
      Appointment.countDocuments({
        scheduledAt: { $gte: dayStart, $lt: dayEnd },
        slot: payload.slot,
        status: { $nin: ['CANCELLED', 'NO_SHOW'] },
      }),
    ]);

    if (dayCount >= maxDaily) {
      throw new ApiError('That day is fully booked. Please choose another date.', 409);
    }
    if (slotCount >= bays) {
      throw new ApiError('That time slot is full. Please pick a different time.', 409);
    }

    const email = payload.email?.toLowerCase() || undefined;
    let customer = await Customer.findOne({
      $or: [{ phone: payload.phone }, ...(email ? [{ email }] : [])],
    });

    if (!customer) {
      customer = await Customer.create({
        code: generateCode('CUS'),
        name: payload.name,
        email,
        phone: payload.phone,
      });
    }

    const registration = payload.registrationNumber.toUpperCase().replace(/\s+/g, '');
    let vehicle = await Vehicle.findOne({ registrationNumber: registration });

    if (!vehicle) {
      vehicle = await Vehicle.create({
        customer: customer._id,
        registrationNumber: registration,
        make: payload.make,
        model: payload.model,
        year: payload.year,
        fuelType: payload.fuelType,
      });
    } else if (String(vehicle.customer) !== String(customer._id)) {
      // Vehicle changed hands — move it to the booking customer.
      vehicle.customer = customer._id;
      await vehicle.save();
    }

    const services = await Service.find({ _id: { $in: payload.services }, isActive: true })
      .select('basePrice')
      .lean();
    if (!services.length) throw new ApiError('Pick at least one available service', 422);

    const appointment = await Appointment.create({
      code: generateCode('APT'),
      customer: customer._id,
      vehicle: vehicle._id,
      services: services.map((s) => s._id),
      scheduledAt,
      slot: payload.slot,
      status: 'PENDING',
      source: 'ONLINE',
      estimatedCost: services.reduce((sum, s) => sum + (s.basePrice ?? 0), 0),
      concern: payload.concern,
      pickupRequired: payload.pickupRequired ?? false,
      pickupAddress: payload.pickupAddress,
      statusHistory: [{ status: 'PENDING', at: new Date(), note: 'Booked online' }],
    });

    await Service.updateMany({ _id: { $in: payload.services } }, { $inc: { bookingCount: 1 } });

    await logAudit({
      actor: user ?? null,
      action: 'PUBLIC_BOOKING',
      entity: 'Appointment',
      entityId: String(appointment._id),
      summary: `Online booking ${appointment.code} for ${registration}`,
      req,
    });

    return ok(
      {
        code: appointment.code,
        scheduledAt: appointment.scheduledAt,
        slot: appointment.slot,
        estimatedCost: appointment.estimatedCost,
        trackingUrl: `/track?code=${appointment.code}`,
      },
      { status: 201 },
    );
  },
  { public: true },
);
