import { ok, route } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import ServiceOrder from '@/models/ServiceOrder';
import User from '@/models/User';

/** Technician roster with their current open workload — used by assignment UIs. */
export const GET = route(
  async () => {
    const technicians = await User.find({ role: ROLES.TECHNICIAN, isActive: true })
      .select('name email phone avatarUrl technician')
      .sort({ name: 1 })
      .lean();

    const workload = await ServiceOrder.aggregate([
      { $match: { status: { $nin: ['DELIVERED', 'CANCELLED'] } } },
      { $unwind: '$technicians' },
      { $group: { _id: '$technicians', openJobs: { $sum: 1 } } },
    ]);
    const map = new Map(workload.map((w) => [String(w._id), w.openJobs]));

    return ok({
      items: technicians.map((t) => ({ ...t, openJobs: map.get(String(t._id)) ?? 0 })),
      total: technicians.length,
    });
  },
  { permission: 'order:view' },
);
