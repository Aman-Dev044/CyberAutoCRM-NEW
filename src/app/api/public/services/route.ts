import { ok, route } from '@/lib/api';
import Service from '@/models/Service';

/** Service catalogue for the marketing site and the public booking form. */
export const GET = route(
  async () => {
    const items = await Service.find({ isActive: true })
      .select('name slug category shortDescription basePrice estimatedHours includes icon image isFeatured')
      .sort({ isFeatured: -1, category: 1, name: 1 })
      .lean();
    return ok({ items, total: items.length });
  },
  { public: true },
);
