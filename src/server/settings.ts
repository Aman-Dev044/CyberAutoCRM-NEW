import 'server-only';
import { connectDB } from '@/lib/db';
import Setting from '@/models/Setting';

export type PublicSettings = {
  garage: {
    name: string;
    tagline?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  finance: { currency: string; taxRate: number };
  operations: {
    openTime: string;
    closeTime: string;
    slotMinutes: number;
    maxDailyAppointments: number;
    bayCount: number;
  };
};

const FALLBACK: PublicSettings = {
  garage: {
    name: 'CyberAutoSuite Service Center',
    tagline: 'Your car deserves a co-pilot, not a mechanic.',
    email: 'info@cyberautosuite.com',
    phone: '+91 98765 43210',
    address: 'Plot 14, Industrial Area Phase 2, Chandigarh 160002',
  },
  finance: { currency: 'INR', taxRate: 18 },
  operations: {
    openTime: '09:00',
    closeTime: '19:00',
    slotMinutes: 30,
    maxDailyAppointments: 24,
    bayCount: 6,
  },
};

/**
 * Settings for public pages. Never throws — a cold or unreachable database
 * must not take the marketing site down.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    await connectDB();
    const doc = await Setting.findOne({ key: 'global' }).lean();
    if (!doc) return FALLBACK;
    return {
      garage: {
        name: doc.garage?.name ?? FALLBACK.garage.name,
        tagline: doc.garage?.tagline,
        email: doc.garage?.email,
        phone: doc.garage?.phone,
        address: doc.garage?.address,
      },
      finance: {
        currency: doc.finance?.currency ?? 'INR',
        taxRate: doc.finance?.taxRate ?? 18,
      },
      operations: {
        openTime: doc.operations?.openTime ?? '09:00',
        closeTime: doc.operations?.closeTime ?? '19:00',
        slotMinutes: doc.operations?.slotMinutes ?? 30,
        maxDailyAppointments: doc.operations?.maxDailyAppointments ?? 24,
        bayCount: doc.operations?.bayCount ?? 6,
      },
    };
  } catch (err) {
    console.warn('[settings] falling back to defaults:', (err as Error).message);
    return FALLBACK;
  }
}
