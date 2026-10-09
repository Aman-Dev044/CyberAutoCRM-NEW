import { ok, route, searchParams } from '@/lib/api';
import {
  getReportBundle,
  getRevenueSeries,
  getTechnicianPerformance,
  getTopServices,
} from '@/server/analytics';

export const GET = route(
  async ({ req }) => {
    const days = Math.min(365, Math.max(7, Number(searchParams(req).get('days') ?? 30) || 30));

    const [bundle, series, technicians, services] = await Promise.all([
      getReportBundle(days),
      getRevenueSeries(12),
      getTechnicianPerformance(8),
      getTopServices(8),
    ]);

    return ok({ days, ...bundle, series, technicians, services });
  },
  { permission: 'report:view' },
);
