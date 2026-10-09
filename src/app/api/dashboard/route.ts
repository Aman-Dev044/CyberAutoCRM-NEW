import { ok, route } from '@/lib/api';
import {
  getDashboardStats,
  getOrderStatusBreakdown,
  getRevenueSeries,
  getTopServices,
} from '@/server/analytics';

export const GET = route(
  async () => {
    const [stats, series, statuses, services] = await Promise.all([
      getDashboardStats(),
      getRevenueSeries(6),
      getOrderStatusBreakdown(),
      getTopServices(6),
    ]);
    return ok({ stats, series, statuses, services });
  },
  { permission: 'dashboard:view' },
);
