'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  IndianRupee,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { FUEL_TYPES, TIME_SLOTS } from '@/lib/constants';
import { cn, formatCurrency } from '@/lib/utils';
import { ServiceIcon } from './ServiceIcon';
import type { PublicService } from '@/server/catalog';

const STEPS = ['Services', 'Vehicle & You', 'Date & Time', 'Done'] as const;

type Form = {
  services: string[];
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  fuelType: string;
  scheduledAt: string;
  slot: string;
  concern: string;
  pickupRequired: boolean;
  pickupAddress: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function BookingForm({
  services,
  preselect = [],
}: {
  services: PublicService[];
  preselect?: string[];
}) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ code: string; estimatedCost: number } | null>(null);

  const [form, setForm] = useState<Form>({
    services: preselect.filter((id) => services.some((s) => s.id === id)),
    name: '',
    email: '',
    phone: '',
    registrationNumber: '',
    make: '',
    model: '',
    year: String(new Date().getFullYear() - 3),
    fuelType: 'Petrol',
    scheduledAt: todayISO(),
    slot: '10:00',
    concern: '',
    pickupRequired: false,
    pickupAddress: '',
  });

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const grouped = useMemo(() => {
    const map = new Map<string, PublicService[]>();
    services.forEach((s) => {
      map.set(s.category, [...(map.get(s.category) ?? []), s]);
    });
    return [...map.entries()];
  }, [services]);

  const chosen = services.filter((s) => form.services.includes(s.id));
  const estimate = chosen.reduce((sum, s) => sum + s.basePrice, 0);
  const estimatedHours = chosen.reduce((sum, s) => sum + s.estimatedHours, 0);

  const toggleService = (id: string) =>
    setForm((f) => ({
      ...f,
      services: f.services.includes(id)
        ? f.services.filter((s) => s !== id)
        : [...f.services, id],
    }));

  const canContinue = () => {
    if (step === 0) return form.services.length > 0;
    if (step === 1)
      return (
        form.name.trim().length > 1 &&
        form.phone.trim().length > 6 &&
        form.registrationNumber.trim().length > 3 &&
        form.make.trim() &&
        form.model.trim()
      );
    if (step === 2) return !!form.scheduledAt && !!form.slot;
    return false;
  };

  const submit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const data = await apiPost<{ code: string; estimatedCost: number }>('/api/public/booking', {
        ...form,
        year: Number(form.year),
        email: form.email || undefined,
      });
      setResult(data);
      setStep(3);
      toast.success('Booking confirmed', `Your reference is ${data.code}`);
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Booking failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        {/* Step rail */}
        <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full text-xs font-bold transition-colors',
                  i < step
                    ? 'bg-success text-white'
                    : i === step
                      ? 'bg-brand text-brand-contrast'
                      : 'bg-surface-2 text-subtle',
                )}
              >
                {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs font-semibold',
                  i === step ? 'text-ink' : 'text-subtle',
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="hidden h-px w-8 bg-line-strong sm:block" />
              ) : null}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <div className="space-y-7">
            {grouped.map(([category, list]) => (
              <div key={category}>
                <h3 className="mb-3 text-xs font-bold tracking-[0.14em] text-subtle uppercase">
                  {category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {list.map((s) => {
                    const active = form.services.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={cn(
                          'group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                          active
                            ? 'border-brand bg-brand-soft shadow-float'
                            : 'border-line bg-surface hover:border-brand/50',
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-10 shrink-0 place-items-center rounded-xl transition-colors',
                            active ? 'bg-brand text-brand-contrast' : 'bg-surface-2 text-brand',
                          )}
                        >
                          <ServiceIcon name={s.icon} className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">{s.name}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                            {s.shortDescription}
                          </span>
                          <span className="mt-2 flex items-center gap-3 text-xs">
                            <span className="font-bold text-brand">
                              {formatCurrency(s.basePrice)}
                            </span>
                            <span className="flex items-center gap-1 text-subtle">
                              <Clock className="size-3" />
                              {s.estimatedHours}h
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <FormRow>
              <Field label="Full name" required error={errors.name}>
                <Input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Rohit Malhotra"
                />
              </Field>
              <Field label="Mobile number" required error={errors.phone}>
                <Input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="98765 43210"
                  inputMode="tel"
                />
              </Field>
            </FormRow>

            <Field label="Email" hint="Optional — we send the job card and invoice here." error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <div className="rounded-2xl border border-line bg-surface-2/50 p-4">
              <p className="mb-4 text-xs font-bold tracking-[0.14em] text-subtle uppercase">
                Vehicle details
              </p>
              <div className="space-y-4">
                <FormRow>
                  <Field label="Registration number" required error={errors.registrationNumber}>
                    <Input
                      value={form.registrationNumber}
                      onChange={(e) => set('registrationNumber', e.target.value.toUpperCase())}
                      placeholder="CH01AB1234"
                      className="uppercase"
                    />
                  </Field>
                  <Field label="Fuel type">
                    <Select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
                      {FUEL_TYPES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </FormRow>
                <FormRow cols={3}>
                  <Field label="Make" required error={errors.make}>
                    <Input
                      value={form.make}
                      onChange={(e) => set('make', e.target.value)}
                      placeholder="Hyundai"
                    />
                  </Field>
                  <Field label="Model" required error={errors.model}>
                    <Input
                      value={form.model}
                      onChange={(e) => set('model', e.target.value)}
                      placeholder="Creta"
                    />
                  </Field>
                  <Field label="Year" error={errors.year}>
                    <Input
                      type="number"
                      value={form.year}
                      onChange={(e) => set('year', e.target.value)}
                      min={1950}
                      max={new Date().getFullYear() + 1}
                    />
                  </Field>
                </FormRow>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <FormRow>
              <Field label="Preferred date" required error={errors.scheduledAt}>
                <Input
                  type="date"
                  value={form.scheduledAt}
                  min={todayISO()}
                  onChange={(e) => set('scheduledAt', e.target.value)}
                />
              </Field>
              <Field label="Time slot" required error={errors.slot}>
                <Select value={form.slot} onChange={(e) => set('slot', e.target.value)}>
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormRow>

            <Field
              label="What should we look at?"
              hint="Describe any noise, warning light or issue — it goes straight onto the job card."
              error={errors.concern}
            >
              <Textarea
                value={form.concern}
                onChange={(e) => set('concern', e.target.value)}
                rows={4}
                placeholder="Rattling sound from the front right over speed breakers…"
              />
            </Field>

            <div className="rounded-2xl border border-line bg-surface-2/50 p-4">
              <Checkbox
                label="I need free pickup and drop"
                checked={form.pickupRequired}
                onChange={(e) => set('pickupRequired', e.target.checked)}
              />
              {form.pickupRequired ? (
                <div className="mt-3">
                  <Field label="Pickup address" error={errors.pickupAddress}>
                    <Textarea
                      value={form.pickupAddress}
                      onChange={(e) => set('pickupAddress', e.target.value)}
                      rows={2}
                      placeholder="House 221, Sector 44, Chandigarh"
                    />
                  </Field>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 && result ? (
          <div className="rounded-3xl border border-success/40 bg-success-soft p-8 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success text-white">
              <CheckCircle2 className="size-7" />
            </span>
            <h3 className="mt-5 font-display text-2xl font-bold text-ink">Booking confirmed</h3>
            <p className="mt-2 text-sm text-muted">
              Our service desk will call you to confirm the slot. Keep this reference handy.
            </p>

            <div className="mx-auto mt-6 flex max-w-xs items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <span className="font-mono text-lg font-bold tracking-wider text-ink">
                {result.code}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(result.code);
                  toast.info('Reference copied');
                }}
                className="text-muted transition hover:text-brand"
                aria-label="Copy reference code"
              >
                <Copy className="size-4" />
              </button>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={`/track?code=${result.code}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-contrast"
              >
                Track this service
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center rounded-xl border border-line-strong px-5 text-sm font-semibold text-ink"
              >
                Back to home
              </Link>
            </div>
          </div>
        ) : null}

        {step < 3 ? (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue()}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={!canContinue() || loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirm booking
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Running summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink">Your estimate</h3>

          {chosen.length ? (
            <ul className="mt-4 space-y-3">
              {chosen.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 text-muted">{s.name}</span>
                  <span className="font-semibold text-ink">{formatCurrency(s.basePrice)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-subtle">Pick a service to see your estimate.</p>
          )}

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Labour estimate</dt>
              <dd className="font-semibold text-ink">{formatCurrency(estimate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Workshop time</dt>
              <dd className="font-semibold text-ink">{estimatedHours || 0}h</dd>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2">
              <dt className="font-semibold text-ink">Payable on delivery</dt>
              <dd className="flex items-center font-display text-lg font-bold text-brand">
                <IndianRupee className="size-4" />
                {estimate ? formatCurrency(estimate).replace('₹', '') : '0'}
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-muted">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-brand" />
            Parts are quoted after inspection. Nothing is replaced without your approval on the
            job card.
          </p>
        </div>
      </aside>
    </div>
  );
}
