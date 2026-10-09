import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Award,
  Boxes,
  Eye,
  HeartHandshake,
  Recycle,
  ShieldCheck,
  Target,
  Users,
  Wrench,
} from 'lucide-react';
import { SectionTitle } from '@/components/ui/Card';
import { Reveal } from '@/components/site/Reveal';
import { Counters } from '@/components/site/Counters';
import { getPublicStats } from '@/server/catalog';
import { getPublicSettings } from '@/server/settings';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Fifteen years in the bay and a platform built from it — how CyberAutoSuite runs a modern service center.',
};

const VALUES = [
  {
    icon: Eye,
    title: 'Transparency by default',
    text: 'Every estimate, part number and labour hour is on the job card before work begins. No line item appears after the fact.',
  },
  {
    icon: ShieldCheck,
    title: 'Only what the car needs',
    text: 'Technicians are paid for hours, not for upselling. If a part has life left in it, we tell you to keep it.',
  },
  {
    icon: HeartHandshake,
    title: 'Relationships over transactions',
    text: 'We track service intervals, insurance and PUC so you hear from us before a deadline, not after.',
  },
  {
    icon: Recycle,
    title: 'Responsible workshop',
    text: 'Waste oil, filters and batteries go to authorised recyclers. Water-recycling wash bay as standard.',
  },
];

const TEAM = [
  { name: 'Gurpreet Sandhu', role: 'Lead Technician', focus: 'Engine & transmission', photo: '/images/team-1.jpg' },
  { name: 'Anjali Pawar', role: 'Detailing Lead', focus: 'Paint & ceramic coating', photo: '/images/team-2.jpg' },
  { name: 'Mohit Rawat', role: 'Diagnostics Specialist', focus: 'OBD-II & ECU', photo: '/images/team-3.jpg' },
  { name: 'Deepak Yadav', role: 'Suspension & Brakes', focus: 'Alignment & shockers', photo: '/images/team-4.jpg' },
  { name: 'Aditya Verma', role: 'Founder & Service Head', focus: '15 years · Powertrain' },
  { name: 'Rajeev Thakur', role: 'Workshop Manager', focus: 'Floor & scheduling' },
];

const MILESTONES = [
  ['2010', 'Two bays, one lift', 'Started as a neighbourhood garage with a single hydraulic lift and a paper register.'],
  ['2015', 'Six bays and a parts store', 'Grew to a full workshop; the paper register became an unmanageable stack of files.'],
  ['2019', 'Digital job cards', 'Built our first internal job-card tool because no off-the-shelf tool matched how a bay actually works.'],
  ['2023', 'CyberAutoSuite CRM', 'Rebuilt it properly — bookings, inventory, invoicing and live tracking for every customer.'],
  ['2026', 'Open to other workshops', 'The same platform now runs service centers beyond our own four walls.'],
];

export default async function AboutPage() {
  const [stats, settings] = await Promise.all([getPublicStats(), getPublicSettings()]);

  return (
    <div>
      <section className="hero-aura relative overflow-hidden border-b border-line">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-brand uppercase">
              <Award className="size-3.5" />
              15 years in the bay
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              We built the software we wished existed
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted">
              {settings.garage.name} started with two bays and a paper register. Fifteen years
              later, the thing that changed our business was not a bigger workshop — it was finally
              knowing, at any moment, exactly where every car stood and why.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              CyberAutoSuite is that knowledge, turned into a platform. It is opinionated because it
              came from a real floor: job cards that mirror how a technician works, estimates that
              need approval, and a timeline the customer can read without being translated to.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-contrast transition hover:brightness-110"
              >
                Book a service
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center rounded-xl border border-line-strong px-6 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                Visit the workshop
              </Link>
            </div>
          </div>

          <Reveal delay={120}>
            <div className="photo-frame mb-4 aspect-16/10 shadow-float">
              <Image
                src="/images/workshop-interior.jpg"
                alt="Technicians at work inside the CyberAutoSuite workshop"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="photo-tint object-cover"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Target, label: 'Our mission', text: 'Make a service visit predictable, honest and genuinely quick.' },
                { icon: Users, label: 'Our people', text: '5 factory-trained technicians across engine, electricals, AC and paint.' },
                { icon: Boxes, label: 'Our parts', text: 'OEM-grade only, with the part number printed on your invoice.' },
                { icon: Wrench, label: 'Our workshop', text: `${settings.operations.bayCount} bays, 3D alignment, dust-free paint booth.` },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-card"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <card.icon className="size-5" />
                  </span>
                  <p className="mt-4 text-xs font-bold tracking-wide text-subtle uppercase">
                    {card.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">{card.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line bg-surface-2/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Counters
            items={[
              { label: 'Years in service', value: 15, suffix: '+' },
              { label: 'Customers on record', value: Math.max(stats.customers, 120), suffix: '+' },
              { label: 'Jobs delivered', value: Math.max(stats.jobs, 240), suffix: '+' },
              { label: 'Average rating', value: stats.rating, decimals: true, suffix: '/5' },
            ]}
          />
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="What we stand for"
            title="Four rules we do not bend"
            align="center"
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={(i % 2) * 90}>
                <div className="flex h-full gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent text-brand-contrast">
                    <v.icon className="size-5.5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface-2/40 py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Our story" title="From a paper register to a platform" />
          <ol className="mt-12 space-y-0">
            {MILESTONES.map(([year, title, text], i) => (
              <Reveal key={year} delay={i * 80} as="li">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-line bg-surface font-display text-sm font-bold text-brand">
                      {year}
                    </span>
                    {i < MILESTONES.length - 1 ? (
                      <span className="my-2 w-px flex-1 bg-line-strong" />
                    ) : null}
                  </div>
                  <div className="pb-10">
                    <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Our technicians"
            title="The people who actually touch your car"
            description="Every job card carries the name of the technician who did the work — accountability runs both ways."
            align="center"
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 80}>
                <div className="group h-full overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-float">
                  <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-brand/15 via-surface-2 to-accent/15">
                    {t.photo ? (
                      <Image
                        src={t.photo}
                        alt={`${t.name}, ${t.role}`}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="photo-tint object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid size-20 place-items-center rounded-2xl bg-surface font-display text-xl font-extrabold text-brand shadow-card">
                        {t.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    )}
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-display text-base font-bold text-ink">{t.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-brand">{t.role}</p>
                    <p className="mt-2 text-xs text-muted">{t.focus}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
