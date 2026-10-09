import 'server-only';
import { connectDB } from '@/lib/db';
import { pct } from '@/lib/utils';
import Appointment from '@/models/Appointment';
import Customer from '@/models/Customer';
import Invoice from '@/models/Invoice';
import Part from '@/models/Part';
import Service from '@/models/Service';
import ServiceOrder from '@/models/ServiceOrder';
import User from '@/models/User';
import Vehicle from '@/models/Vehicle';
import ContactMessage from '@/models/ContactMessage';
import { ROLES } from '@/lib/constants';

const DAY = 86400000;

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function monthStart(offset = 0) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - offset, 1);
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export async function getDashboardStats() {
  await connectDB();

  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + DAY);
  const thisMonth = monthStart(0);
  const lastMonth = monthStart(1);

  const [
    revenueThisMonth,
    revenueLastMonth,
    outstanding,
    todaysAppointments,
    upcomingAppointments,
    activeJobs,
    jobsDeliveredThisMonth,
    jobsDeliveredLastMonth,
    customersTotal,
    customersThisMonth,
    customersLastMonth,
    vehiclesTotal,
    lowStock,
    techniciansActive,
    unreadMessages,
    avgTicket,
  ] = await Promise.all([
    Invoice.aggregate([
      { $match: { issuedAt: { $gte: thisMonth }, status: { $ne: 'VOID' } } },
      { $group: { _id: null, total: { $sum: '$total' }, paid: { $sum: '$amountPaid' } } },
    ]),
    Invoice.aggregate([
      { $match: { issuedAt: { $gte: lastMonth, $lt: thisMonth }, status: { $ne: 'VOID' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { status: { $in: ['SENT', 'PARTIAL', 'OVERDUE'] } } },
      { $group: { _id: null, total: { $sum: '$balance' }, count: { $sum: 1 } } },
    ]),
    Appointment.countDocuments({ scheduledAt: { $gte: today, $lt: tomorrow } }),
    Appointment.countDocuments({
      scheduledAt: { $gte: tomorrow },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    }),
    ServiceOrder.countDocuments({ status: { $nin: ['DELIVERED', 'CANCELLED'] } }),
    ServiceOrder.countDocuments({ status: 'DELIVERED', deliveredAt: { $gte: thisMonth } }),
    ServiceOrder.countDocuments({
      status: 'DELIVERED',
      deliveredAt: { $gte: lastMonth, $lt: thisMonth },
    }),
    Customer.countDocuments({}),
    Customer.countDocuments({ createdAt: { $gte: thisMonth } }),
    Customer.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
    Vehicle.countDocuments({}),
    Part.countDocuments({ $expr: { $lte: ['$stockQty', '$reorderLevel'] }, isActive: true }),
    User.countDocuments({ role: ROLES.TECHNICIAN, isActive: true }),
    ContactMessage.countDocuments({ status: 'NEW' }),
    Invoice.aggregate([
      { $match: { status: { $ne: 'VOID' } } },
      { $group: { _id: null, avg: { $avg: '$total' } } },
    ]),
  ]);

  const revenue = revenueThisMonth[0]?.total ?? 0;
  const prevRevenue = revenueLastMonth[0]?.total ?? 0;

  return {
    revenue: {
      value: revenue,
      collected: revenueThisMonth[0]?.paid ?? 0,
      delta: pct(revenue, prevRevenue),
    },
    outstanding: {
      value: outstanding[0]?.total ?? 0,
      count: outstanding[0]?.count ?? 0,
    },
    appointments: { today: todaysAppointments, upcoming: upcomingAppointments },
    jobs: {
      active: activeJobs,
      delivered: jobsDeliveredThisMonth,
      delta: pct(jobsDeliveredThisMonth, jobsDeliveredLastMonth),
    },
    customers: {
      total: customersTotal,
      new: customersThisMonth,
      delta: pct(customersThisMonth, customersLastMonth),
    },
    vehicles: vehiclesTotal,
    lowStock,
    technicians: techniciansActive,
    unreadMessages,
    avgTicket: Math.round(avgTicket[0]?.avg ?? 0),
  };
}

/** Revenue + job volume for the last `months` calendar months, oldest first. */
export async function getRevenueSeries(months = 6) {
  await connectDB();
  const from = monthStart(months - 1);

  const [invoices, jobs] = await Promise.all([
    Invoice.aggregate([
      { $match: { issuedAt: { $gte: from }, status: { $ne: 'VOID' } } },
      {
        $group: {
          _id: { y: { $year: '$issuedAt' }, m: { $month: '$issuedAt' } },
          billed: { $sum: '$total' },
          collected: { $sum: '$amountPaid' },
        },
      },
    ]),
    ServiceOrder.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          jobs: { $sum: 1 },
        },
      },
    ]),
  ]);

  const key = (y: number, m: number) => `${y}-${m}`;
  const billedMap = new Map(invoices.map((r) => [key(r._id.y, r._id.m), r]));
  const jobsMap = new Map(jobs.map((r) => [key(r._id.y, r._id.m), r.jobs]));

  return Array.from({ length: months }, (_, i) => {
    const d = monthStart(months - 1 - i);
    const k = key(d.getFullYear(), d.getMonth() + 1);
    return {
      month: d.toLocaleString('en-IN', { month: 'short' }),
      billed: billedMap.get(k)?.billed ?? 0,
      collected: billedMap.get(k)?.collected ?? 0,
      jobs: jobsMap.get(k) ?? 0,
    };
  });
}

export async function getOrderStatusBreakdown() {
  await connectDB();
  const rows = await ServiceOrder.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.map((r) => ({ status: r._id as string, count: r.count as number }));
}

export async function getTopServices(limit = 6) {
  await connectDB();
  const rows = await ServiceOrder.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        jobs: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ name: r._id as string, jobs: r.jobs as number, revenue: r.revenue as number }));
}

export async function getTechnicianPerformance(limit = 6) {
  await connectDB();
  const rows = await ServiceOrder.aggregate([
    { $match: { status: 'DELIVERED' } },
    { $unwind: '$technicians' },
    {
      $group: {
        _id: '$technicians',
        jobs: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
        avgRating: { $avg: '$customerRating' },
      },
    },
    { $sort: { jobs: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
        pipeline: [{ $project: { name: 1, technician: 1 } }],
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ]);

  return rows.map((r) => ({
    id: String(r._id),
    name: (r.user?.name as string) ?? 'Unassigned',
    specialization: (r.user?.technician?.specialization as string) ?? '—',
    jobs: r.jobs as number,
    revenue: r.revenue as number,
    avgRating: r.avgRating ? Number((r.avgRating as number).toFixed(1)) : null,
  }));
}

export async function getRecentJobs(limit = 6) {
  await connectDB();
  return ServiceOrder.find({})
    .populate('customer', 'name')
    .populate('vehicle', 'registrationNumber make model')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getTodaySchedule() {
  await connectDB();
  const today = startOfDay();
  return Appointment.find({ scheduledAt: { $gte: today, $lt: new Date(today.getTime() + DAY) } })
    .populate('customer', 'name phone')
    .populate('vehicle', 'registrationNumber make model')
    .populate('services', 'name')
    .sort({ slot: 1 })
    .lean();
}

/** Deeper slice used by the reports page. */
export async function getReportBundle(days = 30) {
  await connectDB();
  const from = new Date(Date.now() - days * DAY);

  const [revenueByDay, paymentMix, categoryMix, funnel, inventoryValue, csat] = await Promise.all([
    Invoice.aggregate([
      { $match: { issuedAt: { $gte: from }, status: { $ne: 'VOID' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' } },
          billed: { $sum: '$total' },
          collected: { $sum: '$amountPaid' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Invoice.aggregate([
      { $unwind: '$payments' },
      { $match: { 'payments.at': { $gte: from } } },
      { $group: { _id: '$payments.method', amount: { $sum: '$payments.amount' } } },
      { $sort: { amount: -1 } },
    ]),
    Service.aggregate([
      { $group: { _id: '$category', bookings: { $sum: '$bookingCount' }, services: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
    ]),
    Appointment.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Part.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          stockValue: { $sum: { $multiply: ['$stockQty', '$costPrice'] } },
          retailValue: { $sum: { $multiply: ['$stockQty', '$unitPrice'] } },
          skus: { $sum: 1 },
        },
      },
    ]),
    ServiceOrder.aggregate([
      { $match: { customerRating: { $gte: 1 } } },
      { $group: { _id: null, avg: { $avg: '$customerRating' }, responses: { $sum: 1 } } },
    ]),
  ]);

  return {
    revenueByDay: revenueByDay.map((r) => ({
      date: r._id as string,
      billed: r.billed as number,
      collected: r.collected as number,
    })),
    paymentMix: paymentMix.map((r) => ({ method: r._id as string, amount: r.amount as number })),
    categoryMix: categoryMix.map((r) => ({
      category: r._id as string,
      bookings: r.bookings as number,
      services: r.services as number,
    })),
    funnel: Object.fromEntries(funnel.map((f) => [f._id as string, f.count as number])),
    inventory: inventoryValue[0] ?? { stockValue: 0, retailValue: 0, skus: 0 },
    csat: csat[0] ? { avg: Number((csat[0].avg as number).toFixed(2)), responses: csat[0].responses } : null,
  };
}
