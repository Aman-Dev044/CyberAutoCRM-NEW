import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarCheck,
  CarFront,
  ClipboardList,
  Clock,
  CreditCard,
  Gauge,
  Layers,
  LineChart,
  PhoneCall,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
} from 'lucide-react';
import { SectionTitle } from '@/components/ui/Card';
import { Reveal } from '@/components/site/Reveal';
import { Counters } from '@/components/site/Counters';
import { Testimonials } from '@/components/site/Testimonials';
import { ContactForm } from '@/components/site/ContactForm';
import { ServiceIcon } from '@/components/site/ServiceIcon';
import { getPublicServices, getPublicStats } from '@/server/catalog';
import { getPublicSettings } from '@/server/settings';
import { formatCurrency } from '@/lib/utils';

const PILLARS = [
  {
    icon: LineChart,
    title: 'Deep Insights',
    text: 'Turn every job card into analysis you can act on — customer behaviour, repeat intervals, technician throughput and margin per service.',
  },
  {
    icon: Layers,
    title: 'Simplify Complexity',
    text: 'One board for the whole workshop. Your advisors stop chasing status on the floor and spend that time with customers instead.',
  },
  {
    icon: Gauge,
    title: 'Scales With You',
    text: 'Add services, bays, technicians or a second location. Roles and permissions keep the right people on the right screens.',
  },
];

const VALUE = [
  {
    n: '01',
    icon: CalendarCheck,
    title: 'Effortless service scheduling',
    text: 'Customers pick a slot online at midnight and get a confirmation without a single phone call. Capacity rules stop you from overbooking a bay.',
  },
  {
    n: '02',
    icon: ClipboardList,
    title: 'A genuinely personal history',
    text: 'Every visit, part and observation sits on the vehicle record — so the advice on visit six is built on visits one to five.',
  },
  {
    n: '03',
    icon: Radar,
    title: 'Real-time status, no chasing',
    text: 'Diagnosis, awaiting parts, quality check, ready. The customer watches the same timeline your floor manager does.',
  },
];

const FEATURES = [
  { icon: Users, title: 'Customer 360', text: 'Profiles, vehicles, preferences, spend and visit history in one place.' },
  { icon: CalendarCheck, title: 'Online booking', text: 'Slot capacity, bay limits and automatic reference codes.' },
  { icon: Wrench, title: 'Digital job cards', text: 'Labour, parts, technicians and a timestamped work log per job.' },
  { icon: CreditCard, title: 'Invoicing & payments', text: 'GST-ready invoices, part payments and outstanding tracking.' },
  { icon: Layers, title: 'Parts inventory', text: 'Stock levels, reorder alerts and cost-vs-retail margin visibility.' },
  { icon: BarChart3, title: 'Reports that matter', text: 'Revenue, technician performance, service mix and CSAT.' },
  { icon: BellRing, title: 'Smart reminders', text: 'Service due, insurance expiry and PUC alerts before they lapse.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'Super admin, admin, manager and technician scopes with an audit trail.' },
];

const WORKFLOW = [
  { step: 'Book', text: 'Customer books online or the front desk logs a walk-in.', icon: CalendarCheck },
  { step: 'Inspect', text: 'A job card opens with the complaint, odometer and photos.', icon: ClipboardList },
  { step: 'Approve', text: 'Estimate goes out; work starts only once it is approved.', icon: ShieldCheck },
  { step: 'Repair', text: 'Technicians log progress; parts come off stock automatically.', icon: Wrench },
  { step: 'Deliver', text: 'Quality check, invoice, payment, and a feedback request.', icon: CarFront },
];

const GALLERY = [
  { src: '/images/workshop-lift.jpg', alt: 'Car raised on a hydraulic lift inside the service bay' },
  { src: '/images/service-brakes.jpg', alt: 'Brake calliper and disc during a brake overhaul' },
  { src: '/images/service-oil.jpg', alt: 'Technician pouring fresh engine oil during a service' },
  { src: '/images/service-detailing.jpg', alt: 'Machine polishing a car body during detailing' },
  { src: '/images/service-diagnostics.jpg', alt: 'OBD-II scanner reading fault codes from a vehicle' },
  { src: '/images/service-tyres.jpg', alt: 'Technician replacing a tyre in the workshop' },
];

export default async function HomePage() {
  const [services, stats, settings] = await Promise.all([
    getPublicServices(),
    getPublicStats(),
    getPublicSettings(),
  ]);

  const featured = services.filter((s) => s.isFeatured).slice(0, 6);
  const shown = featured.length ? featured : services.slice(0, 6);

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        {/* Workshop photograph, scrimmed so the copy keeps full contrast */}
        <div className="photo-scrim-side absolute inset-0">
          <Image
            src="/images/hero-workshop.jpg"
            alt="Modern car repair workshop with vehicles on lifts"
            fill
            priority
            sizes="100vw"
            className="photo-tint object-cover object-center"
          />
        </div>
        {/* Below lg the copy runs full width, so the photo needs a flat veil too. */}
        <div className="absolute inset-0 bg-bg/75 lg:hidden" />
        <div className="grid-bg absolute inset-0 opacity-40" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pt-24 lg:pb-28">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-brand uppercase backdrop-blur">
                <Sparkles className="size-3.5" />
                Auto Service CRM
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 font-display text-4xl leading-[1.08] font-extrabold text-ink sm:text-5xl lg:text-6xl">
                Your car&apos;s{' '}
                <span className="brand-gradient-text">co-pilot</span>
                <br />
                in the service center.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {settings.garage.tagline ?? 'Build real relationships with your customers.'}{' '}
                CyberAutoSuite runs the booking, the job card, the parts, the invoice and the
                follow-up — so nothing about a visit lives in someone&apos;s head.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/book"
                  className="inline-flex h-13 items-center gap-2 rounded-xl bg-brand px-7 text-sm font-semibold text-brand-contrast transition hover:brightness-110"
                >
                  Book a service
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex h-13 items-center gap-2 rounded-xl border border-line-strong bg-surface/70 px-7 text-sm font-semibold text-ink backdrop-blur transition hover:border-brand hover:text-brand"
                >
                  <Radar className="size-4" />
                  Track my car
                </Link>
                <a
                  href={`tel:${(settings.garage.phone ?? '').replace(/\s/g, '')}`}
                  className="inline-flex h-13 items-center gap-2 px-2 text-sm font-semibold text-muted transition hover:text-brand"
                >
                  <PhoneCall className="size-4" />
                  {settings.garage.phone}
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line/70 pt-7">
                {[
                  ['42-point', 'service checklist'],
                  ['Live', 'status tracking'],
                  ['Zero', 'surprise invoices'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-display text-xl font-bold text-ink">{k}</dt>
                    <dd className="mt-0.5 text-xs text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Live board mock — this is the product, so it sits beside the photo */}
          <Reveal delay={200} className="relative">
            <div className="glow-ring relative rounded-3xl border border-line bg-surface/90 p-5 shadow-pop backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Gauge className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">Workshop board</p>
                    <p className="text-[11px] text-subtle">
                      Live · {settings.operations.bayCount} bays
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success">
                  <span className="size-1.5 animate-pulse rounded-full bg-success" />
                  ON TRACK
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  { reg: 'CH01AB4821', job: 'Brake overhaul', status: 'In progress', tone: 'brand', pct: 62 },
                  { reg: 'CH03KL9077', job: 'AC regas', status: 'Quality check', tone: 'accent', pct: 88 },
                  { reg: 'CH02XY1140', job: 'Periodic service', status: 'Awaiting parts', tone: 'warning', pct: 34 },
                  { reg: 'CH04MN6632', job: 'Ceramic coating', status: 'Ready', tone: 'success', pct: 100 },
                ].map((row) => (
                  <div key={row.reg} className="rounded-xl border border-line bg-surface-2/70 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-ink">{row.reg}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">{row.job}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          row.tone === 'brand'
                            ? 'bg-brand-soft text-brand'
                            : row.tone === 'accent'
                              ? 'bg-accent/15 text-accent'
                              : row.tone === 'warning'
                                ? 'bg-warning-soft text-warning'
                                : 'bg-success-soft text-success'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={`h-full rounded-full ${
                          row.tone === 'brand'
                            ? 'bg-brand'
                            : row.tone === 'accent'
                              ? 'bg-accent'
                              : row.tone === 'warning'
                                ? 'bg-warning'
                                : 'bg-success'
                        }`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5 border-t border-line pt-4">
                {[
                  ['Today', '14 jobs'],
                  ['Revenue', '₹1.8L'],
                  ['CSAT', `${stats.rating}/5`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-surface-2/70 p-2.5 text-center">
                    <p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
                      {k}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-ink">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- pillars */}
      <section className="relative -mt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 90}>
                <div className="group h-full rounded-2xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-float">
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand transition-transform group-hover:scale-105">
                    <p.icon className="size-6" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-ink">{p.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- value */}
      <section id="about" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <SectionTitle
                  eyebrow="About us"
                  title="What you and your customers actually experience"
                  description="Choosing CyberAutoSuite is not about adding software. It is about changing how a visit feels — for the person behind the counter and the person handing over their keys."
                />

                {/* Overlapping photo pair */}
                <div className="relative mt-9 hidden lg:block">
                  <div className="photo-frame aspect-4/3 w-[85%] shadow-float">
                    <Image
                      src="/images/workshop-interior.jpg"
                      alt="Interior of the CyberAutoSuite service workshop"
                      fill
                      sizes="(min-width: 1024px) 40vw, 90vw"
                      className="photo-tint object-cover"
                    />
                  </div>
                  <div className="photo-frame absolute -right-2 -bottom-10 aspect-square w-44 shadow-pop ring-4 ring-bg">
                    <Image
                      src="/images/workshop-engine-check.jpg"
                      alt="Technician inspecting a car engine bay"
                      fill
                      sizes="200px"
                      className="photo-tint object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-pop">
                    <span className="grid size-10 place-items-center rounded-xl bg-warm-soft text-warm">
                      <Star className="size-5 fill-current" />
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold text-ink">{stats.rating}/5</p>
                      <p className="text-[11px] text-muted">average service rating</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 lg:mt-20">
                  <Link
                    href="/about"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong px-5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
                  >
                    More about us
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-contrast transition hover:brightness-110"
                  >
                    <Gauge className="size-4" />
                    See the CRM
                  </Link>
                </div>
              </div>
            </Reveal>

            <ol className="space-y-5">
              {VALUE.map((v, i) => (
                <Reveal key={v.n} delay={i * 110} as="li">
                  <div className="flex gap-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
                    <div className="flex flex-col items-center gap-3">
                      <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent text-brand-contrast">
                        <v.icon className="size-5.5" />
                      </span>
                      <span className="font-display text-xs font-bold text-subtle">{v.n}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink">{v.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}

              {/* Photo card inside the list so the column never feels text-heavy */}
              <Reveal delay={340} as="li">
                <div className="photo-frame relative aspect-16/9 shadow-float">
                  <Image
                    src="/images/workshop-lift.jpg"
                    alt="Vehicle on a hydraulic lift ready for inspection"
                    fill
                    sizes="(min-width: 1024px) 52vw, 90vw"
                    className="photo-tint object-cover"
                  />
                  <div className="photo-scrim absolute inset-0" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <p className="font-display text-lg font-bold text-ink">
                      {settings.operations.bayCount} bays, one shared timeline
                    </p>
                    <p className="mt-1 max-w-md text-sm text-muted">
                      Whatever is happening on the floor is what your customer sees on their phone.
                    </p>
                  </div>
                </div>
              </Reveal>
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ counters */}
      <section className="relative overflow-hidden border-y border-line py-20">
        <Image
          src="/images/workshop-interior.jpg"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-bg/80" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Counters
            items={[
              { label: 'Customers on record', value: Math.max(stats.customers, 120), suffix: '+' },
              { label: 'Vehicles serviced', value: Math.max(stats.vehicles, 180), suffix: '+' },
              { label: 'Jobs delivered', value: Math.max(stats.jobs, 240), suffix: '+' },
              { label: 'Average rating', value: stats.rating, decimals: true, suffix: '/5' },
            ]}
          />
        </div>
      </section>

      {/* ------------------------------------------------------ services */}
      <section id="services" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Our services"
              title="Explore our services"
              description="Transparent pricing, OEM-grade parts and a digital job card for every single one."
              align="center"
            />
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 90}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-float">
                  <div className="relative aspect-16/10 overflow-hidden bg-surface-2">
                    {s.image ? (
                      <Image
                        src={s.image}
                        alt={s.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="photo-tint object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-brand/30">
                        <ServiceIcon name={s.icon} className="size-12" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-full bg-bg/85 px-2.5 py-1 text-[10px] font-bold tracking-wide text-ink uppercase backdrop-blur">
                      {s.category}
                    </span>
                    <span className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-xl bg-brand text-brand-contrast shadow-float">
                      <ServiceIcon name={s.icon} className="size-5" />
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-bold text-ink">{s.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {s.shortDescription}
                    </p>

                    <ul className="mt-4 space-y-1.5">
                      {s.includes.slice(0, 3).map((inc) => (
                        <li key={inc} className="flex items-center gap-2 text-xs text-muted">
                          <span className="size-1.5 rounded-full bg-brand" />
                          {inc}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                      <div>
                        <p className="font-display text-lg font-bold text-brand">
                          {formatCurrency(s.basePrice)}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-subtle">
                          <Clock className="size-3" />
                          approx {s.estimatedHours}h
                        </p>
                      </div>
                      <Link
                        href={`/book?service=${s.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface-2 px-3.5 text-xs font-semibold text-ink transition-colors hover:bg-brand hover:text-brand-contrast"
                      >
                        Book
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/services"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong px-6 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              View all {services.length} services
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ workflow */}
      <section className="border-y border-line bg-surface-2/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="How it works"
              title="Five stages, one timeline"
              description="The same workflow your floor runs on is the one your customer sees — no translation layer, no phone tag."
              align="center"
            />
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WORKFLOW.map((w, i) => (
              <Reveal key={w.step} delay={i * 80}>
                <div className="relative h-full rounded-2xl border border-line bg-surface p-5 text-center shadow-card">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold text-brand-contrast">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mx-auto mt-3 grid size-12 place-items-center rounded-xl bg-brand-soft text-brand">
                    <w.icon className="size-5.5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-ink">{w.step}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- gallery */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Inside the workshop"
              title="Real bays, real work"
              description="Six bays, 3D alignment, a dust-free paint booth and technicians who photograph what they find."
              align="center"
            />
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {GALLERY.map((g, i) => (
              <Reveal key={g.src} delay={(i % 4) * 70}>
                <figure
                  className={`photo-frame group relative shadow-card ${
                    i === 0 ? 'aspect-square lg:col-span-2 lg:aspect-16/10' : 'aspect-square'
                  }`}
                >
                  <Image
                    src={g.src}
                    alt={g.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="photo-tint object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <section className="border-y border-line bg-surface-2/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Inside the CRM"
              title="Everything the counter, the floor and the owner need"
              description="One platform, role-scoped. Technicians see their bay, managers see the board, owners see the money."
            />
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 70}>
                <div className="h-full rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-brand/40">
                  <span className="grid size-10 place-items-center rounded-lg bg-surface-2 text-brand">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionTitle
              eyebrow="Testimonial"
              title="Our clients say"
              align="center"
              className="mb-12"
            />
          </Reveal>
          <Reveal delay={100}>
            <Testimonials />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- contact */}
      <section id="contact" className="border-t border-line bg-surface-2/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <Reveal>
              <SectionTitle
                eyebrow="Contact us"
                title="Contact for any query"
                description="We are here to make you feel supported at every step — quick, reliable help whenever you need it."
              />

              <dl className="mt-10 space-y-5">
                {[
                  { icon: PhoneCall, label: 'Call the service desk', value: settings.garage.phone },
                  { icon: BellRing, label: 'Email us', value: settings.garage.email },
                  { icon: CarFront, label: 'Visit the workshop', value: settings.garage.address },
                ].map((row) => (
                  <div key={row.label} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                      <row.icon className="size-5" />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-subtle uppercase">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-ink">{row.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-10 rounded-2xl border border-line bg-surface p-6 shadow-card">
                <h3 className="font-display text-base font-bold text-ink">Already a customer?</h3>
                <p className="mt-1.5 text-sm text-muted">
                  Sign in to see your vehicles, invoices and live service status.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast"
                  >
                    Customer login
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center rounded-xl border border-line-strong px-4 text-xs font-semibold text-ink"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-line shadow-pop">
              <Image
                src="/images/cta-garage.jpg"
                alt=""
                aria-hidden
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-bg/85" />
              <div className="grid-bg absolute inset-0 opacity-40" />

              <div className="relative p-10 text-center sm:p-16">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold text-ink sm:text-4xl">
                  Upgrade from organised to{' '}
                  <span className="brand-gradient-text">effortless</span>.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-muted">
                  Every part of your service runs smoothly and consistently, so your team can focus
                  on what matters: customers who feel genuinely looked after.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/book"
                    className="inline-flex h-13 items-center gap-2 rounded-xl bg-brand px-7 text-sm font-semibold text-brand-contrast transition hover:brightness-110"
                  >
                    Book a service
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-13 items-center rounded-xl border border-line-strong bg-surface/70 px-7 text-sm font-semibold text-ink backdrop-blur transition hover:border-brand hover:text-brand"
                  >
                    Talk to us
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
