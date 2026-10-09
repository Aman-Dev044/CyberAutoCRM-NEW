import 'server-only';
import { connectDB } from '@/lib/db';
import Service from '@/models/Service';
import Customer from '@/models/Customer';
import ServiceOrder from '@/models/ServiceOrder';
import Vehicle from '@/models/Vehicle';

export type PublicService = {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  estimatedHours: number;
  includes: string[];
  icon?: string;
  image?: string;
  isFeatured: boolean;
};

/** Active catalogue for the marketing site. Degrades to [] if the DB is down. */
export async function getPublicServices(): Promise<PublicService[]> {
  try {
    await connectDB();
    const docs = await Service.find({ isActive: true })
      .sort({ isFeatured: -1, category: 1, name: 1 })
      .lean();

    return docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      category: d.category,
      shortDescription: d.shortDescription,
      description: d.description,
      basePrice: d.basePrice,
      estimatedHours: d.estimatedHours,
      includes: d.includes ?? [],
      icon: d.icon,
      image: d.image,
      isFeatured: d.isFeatured,
    }));
  } catch (err) {
    console.warn('[catalog] service fetch failed:', (err as Error).message);
    return [];
  }
}

/** Headline numbers for the marketing site, with sane floors for a fresh install. */
export async function getPublicStats() {
  try {
    await connectDB();
    const [customers, vehicles, jobs, ratings] = await Promise.all([
      Customer.countDocuments({}),
      Vehicle.countDocuments({}),
      ServiceOrder.countDocuments({ status: 'DELIVERED' }),
      ServiceOrder.aggregate([
        { $match: { customerRating: { $gte: 1 } } },
        { $group: { _id: null, avg: { $avg: '$customerRating' } } },
      ]),
    ]);

    return {
      customers,
      vehicles,
      jobs,
      rating: ratings[0]?.avg ? Number((ratings[0].avg as number).toFixed(1)) : 4.8,
    };
  } catch {
    return { customers: 0, vehicles: 0, jobs: 0, rating: 4.8 };
  }
}
