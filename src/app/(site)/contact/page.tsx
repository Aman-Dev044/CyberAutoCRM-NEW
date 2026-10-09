import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import { SectionTitle } from '@/components/ui/Card';
import { ContactForm } from '@/components/site/ContactForm';
import { getPublicSettings } from '@/server/settings';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Call, email or visit the workshop — our service desk replies within one working day.',
};

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const { garage, operations } = settings;

  return (
    <div>
      <section className="hero-aura relative overflow-hidden border-b border-line">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Contact us"
            title="Contact for any query"
            description="We are here to make sure you feel supported at every step, with quick and reliable assistance whenever you need it."
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-4">
            {[
              {
                icon: Phone,
                label: 'Service desk',
                value: garage.phone,
                href: `tel:${(garage.phone ?? '').replace(/\s/g, '')}`,
                note: 'Fastest way to reach us during working hours.',
              },
              {
                icon: Mail,
                label: 'Email',
                value: garage.email,
                href: `mailto:${garage.email}`,
                note: 'Estimates, invoices and fleet enquiries.',
              },
              {
                icon: MapPin,
                label: 'Workshop',
                value: garage.address,
                note: `${operations.bayCount} bays · customer lounge · free parking`,
              },
              {
                icon: Clock,
                label: 'Working hours',
                value: `Mon–Sat ${operations.openTime}–${operations.closeTime}`,
                note: 'Sunday 09:00–14:00 for pickups and deliveries only.',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <row.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-wide text-subtle uppercase">
                    {row.label}
                  </p>
                  {row.href ? (
                    <a
                      href={row.href}
                      className="mt-1 block text-sm font-semibold text-ink hover:text-brand"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-ink">{row.value}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">{row.note}</p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-brand/30 bg-brand-soft p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <MessageSquare className="size-4.5 text-brand" />
                Already booked?
              </h3>
              <p className="mt-1.5 text-sm text-muted">
                Skip the call — track your car&apos;s live status with your reference code.
              </p>
              <Link
                href="/track"
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast"
              >
                Track my service
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink">Send us a message</h2>
            <p className="mt-1.5 text-sm text-muted">
              Tell us what your car needs and we will come back with a plan and a price.
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </div>
        </div>

        <div className="mt-14 overflow-hidden rounded-3xl border border-line shadow-card">
          <iframe
            title="Workshop location"
            src="https://www.google.com/maps?q=Industrial%20Area%20Phase%202%20Chandigarh&output=embed"
            className="h-[360px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
