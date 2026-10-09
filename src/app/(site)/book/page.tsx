import type { Metadata } from 'next';
import { CalendarCheck, ShieldCheck, Truck } from 'lucide-react';
import { BookingForm } from '@/components/site/BookingForm';
import { getPublicServices } from '@/server/catalog';
import { getPublicSettings } from '@/server/settings';

export const metadata: Metadata = {
  title: 'Book a Service',
  description:
    'Pick your services, choose a slot and get an instant estimate. Free pickup and drop available.',
};

const PROMISES = [
  { icon: ShieldCheck, title: 'No work without approval', text: 'You see the estimate before a single bolt is turned.' },
  { icon: CalendarCheck, title: 'Slot held for you', text: 'Capacity-checked against live bay availability.' },
  { icon: Truck, title: 'Pickup and drop', text: 'Free within city limits on services above ₹3,000.' },
];

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const [services, settings, params] = await Promise.all([
    getPublicServices(),
    getPublicSettings(),
    searchParams,
  ]);

  const preselect = params.service ? [params.service] : [];

  return (
    <div className="hero-aura relative">
      <div className="grid-bg absolute inset-0 h-80 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-brand uppercase">
            Online booking
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold text-ink sm:text-5xl">
            Book your service in under a minute
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Choose what your car needs, pick a time that suits you, and we will confirm the slot.
            Open {settings.operations.openTime}–{settings.operations.closeTime}, {settings.operations.bayCount} bays.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <div
              key={p.title}
              className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <p.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{p.title}</p>
                <p className="mt-0.5 text-xs text-muted">{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
          {services.length ? (
            <BookingForm services={services} preselect={preselect} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              The service catalogue is not available right now. Please call{' '}
              <a href={`tel:${settings.garage.phone}`} className="font-semibold text-brand">
                {settings.garage.phone}
              </a>{' '}
              and we will book you in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
