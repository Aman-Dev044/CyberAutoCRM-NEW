import mongoose from 'mongoose';
import { ApiError, ok, route } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import Appointment from '@/models/Appointment';
import Customer from '@/models/Customer';
import Invoice from '@/models/Invoice';
import ServiceOrder from '@/models/ServiceOrder';
import Vehicle from '@/models/Vehicle';

export const GET = route(
  async ({ user }) => {
    if (!user.customerId) throw new ApiError('No customer record linked to this account', 400);
    const customerId = user.customerId;

    const [customer, vehicles, appointments, orders, invoices, spend] = await Promise.all([
      Customer.findById(customerId).lean(),
      Vehicle.find({ customer: customerId }).sort({ createdAt: -1 }).lean(),
      Appointment.find({ customer: customerId })
        .populate('vehicle', 'registrationNumber make model')
        .populate('services', 'name basePrice')
        .sort({ scheduledAt: -1 })
        .limit(10)
        .lean(),
      ServiceOrder.find({ customer: customerId })
        .populate('vehicle', 'registrationNumber make model')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Invoice.find({ customer: customerId }).sort({ issuedAt: -1 }).limit(10).lean(),
      Invoice.aggregate([
        {
          $match: {
            customer: new mongoose.Types.ObjectId(customerId),
            status: { $ne: 'VOID' },
          },
        },
        { $group: { _id: null, billed: { $sum: '$total' }, due: { $sum: '$balance' } } },
      ]),
    ]);

    const activeOrder = orders.find((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
    const nextAppointment = [...appointments]
      .reverse()
      .find(
        (a) =>
          new Date(a.scheduledAt).getTime() >= Date.now() - 3600000 &&
          ['PENDING', 'CONFIRMED'].includes(a.status),
      );

    return ok({
      customer,
      vehicles,
      appointments,
      orders,
      invoices,
      activeOrder: activeOrder ?? null,
      nextAppointment: nextAppointment ?? null,
      totals: {
        vehicles: vehicles.length,
        visits: customer?.visitCount ?? 0,
        spend: customer?.totalSpend ?? 0,
        due: spend[0]?.due ?? 0,
      },
    });
  },
  { roles: [ROLES.CUSTOMER] },
);
