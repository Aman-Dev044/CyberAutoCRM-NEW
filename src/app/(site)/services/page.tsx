import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { SectionTitle } from '@/components/ui/Card';
import { Reveal } from '@/components/site/Reveal';
import { ServiceIcon } from '@/components/site/ServiceIcon';
import { getPublicServices } from '@/server/catalog';
import { formatCurrency, slugify } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Services & Pricing',
  description:
    'Periodic maintenance, diagnostics, mechanical repair, AC, detailing, tyres and EV checks — with transparent starting prices.',
};

export default async function ServicesPage() {
  const services = await getPublicServices();

  const byCategory = services.reduce<Record<string, typeof services>>((acc, s) => {
    acc[s.category] = [...(acc[s.category] ?? []), s];
    return acc;
  }, {});
  const categories = Object.keys(byCategory);

  return (
    <div className="relative">
      <section className="hero-aura relative overflow-hidden border-b border-line">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionTitle
            eyebrow="Our services"
            title="Everything your car needs, priced up front"
            description="Starting prices below cover labour. Parts are quoted after inspection and never fitted without your approval on the job card."
          />

          {categories.length ? (
            <nav className="mt-10 flex flex-wrap gap-2">
              {categories.map((c) => (
                <a
                  key={c}
                  href={`#${slugify(c)}`}
                  className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
                >
                  {c}
                  <span className="ml-1.5 text-subtle">{byCategory[c].length}</span>
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-20 sm:px-6 lg:px-8">
        {categories.map((category) => (
          <section key={category} id={slugify(category)} className="scroll-mt-28">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">{category}</h2>
              <p className="text-xs text-subtle">
                {byCategory[category].length} service
                {byCategory[category].length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {byCategory[category].map((s, i) => (
                <Reveal key={s.id} delay={(i % 2) * 90}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all hover:border-brand/40 hover:shadow-float">
                    {s.image ? (
                      <div className="relative aspect-21/9 overflow-hidden bg-surface-2">
                        <Image
                          src={s.image}
                          alt={s.name}
                          fill
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="photo-tint object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                        <ServiceIcon name={s.icon} className="size-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-bold text-ink">{s.name}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                          {s.shortDescription}
                        </p>
                      </div>
                    </div>

                    {s.includes.length ? (
                      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                        {s.includes.map((inc) => (
                          <li key={inc} className="flex items-start gap-2 text-xs text-muted">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                            {inc}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                      <div>
                        <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
                          Starts at
                        </p>
                        <p className="font-display text-xl font-bold text-brand">
                          {formatCurrency(s.basePrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <Clock className="size-3.5" />
                          {s.estimatedHours}h in workshop
                        </span>
                        <Link
                          href={`/book?service=${s.id}`}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast transition hover:brightness-110"
                        >
                          Book now
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        {!services.length ? (
          <p className="py-20 text-center text-sm text-muted">
            The catalogue is being updated. Please check back shortly.
          </p>
        ) : null}
      </div>
    </div>
  );
}
