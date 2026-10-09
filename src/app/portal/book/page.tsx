'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarPlus, CarFront, CheckCircle2, Clock, Copy } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { MultiPicker } from '@/components/admin/EntityPicker';
import { ServiceIcon } from '@/components/site/ServiceIcon';
import { apiGet, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { TIME_SLOTS } from '@/lib/constants';
import { cn, formatCurrency } from '@/lib/utils';

type Vehicle = { _id: string; registrationNumber: string; make: string; model: string };
type Service = {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
  estimatedHours: number;
  shortDescription?: string;
  icon?: string;
};

export default function PortalBookPage() {
  const router = useRouter();
  const toast = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicle: '',
    services: [] as string[],
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    slot: '10:00',
    concern: '',
    pickupRequired: false,
    pickupAddress: '',
  });

  useEffect(() => {
    Promise.all([
      apiGet<{ items: Vehicle[] }>('/api/portal/vehicles'),
      apiGet<{ items: Service[] }>('/api/public/services'),
    ])
      .then(([v, s]) => {
        setVehicles(v.items);
        setServices(s.items);
        if (v.items.length === 1) setForm((f) => ({ ...f, vehicle: v.items[0]._id }));
      })
      .catch((err) => toast.error('Could not load the form', (err as ApiClientError).message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chosen = services.filter((s) => form.services.includes(s._id));
  const estimate = chosen.reduce((sum, s) => sum + s.basePrice, 0);
  const hours = chosen.reduce((sum, s) => sum + s.estimatedHours, 0);

  const serviceOptions = useMemo(
    () =>
      services.map((s) => ({
        id: s._id,
        label: s.name,
        sub: `${s.category} · ${formatCurrency(s.basePrice)}`,
      })),
    [services],
  );

  const submit = async () => {
    setSaving(true);
    setErrors({});
    try {
      const res = await apiPost<{ code: string }>('/api/portal/appointments', form);
      setConfirmed(res.code);
      toast.success('Booking requested', `Reference ${res.code}`);
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not book', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-96 rounded-2xl" />;
  }

  if (confirmed) {
    return (
      <Card>
        <CardBody className="py-14 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success text-white">
            <CheckCircle2 className="size-8" />
          </span>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink">Booking requested</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            We will confirm the slot shortly. Keep this reference for tracking.
          </p>

          <div className="mx-auto mt-6 flex max-w-xs items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <span className="font-mono text-lg font-bold tracking-wider text-ink">
              {confirmed}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(confirmed);
                toast.info('Reference copied');
              }}
              className="text-muted transition hover:text-brand"
              aria-label="Copy reference"
            >
              <Copy className="size-4" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.push('/portal')}>Back to my garage</Button>
            <Link
              href={`/track?code=${confirmed}`}
              className="inline-flex h-11 items-center rounded-xl border border-line-strong px-5 text-sm font-semibold text-ink"
            >
              Track this booking
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!vehicles.length) {
    return (
      <Card>
        <EmptyState
          icon={<CarFront className="size-6" />}
          title="Add a vehicle first"
          message="We need to know which car you are bringing in."
          action={
            <Link
              href="/portal/vehicles"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast"
            >
              Add a vehicle
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Book a service</h1>
        <p className="mt-1.5 text-sm text-muted">
          Pick the car, what it needs, and a slot that suits you.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Which vehicle?" icon={<CarFront className="size-4.5" />} />
            <CardBody>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {vehicles.map((v) => (
                  <button
                    key={v._id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, vehicle: v._id }))}
                    className={cn(
                      'rounded-xl border p-4 text-left transition',
                      form.vehicle === v._id
                        ? 'border-brand bg-brand-soft'
                        : 'border-line hover:border-brand/50',
                    )}
                  >
                    <p className="font-mono text-sm font-bold text-ink">{v.registrationNumber}</p>
                    <p className="text-xs text-muted">
                      {v.make} {v.model}
                    </p>
                  </button>
                ))}
              </div>
              {errors.vehicle ? (
                <p className="mt-2 text-xs font-medium text-danger">{errors.vehicle}</p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What does it need?" icon={<ServiceIcon className="size-4.5" />} />
            <CardBody>
              <MultiPicker
                options={serviceOptions}
                value={form.services}
                onChange={(ids) => setForm((f) => ({ ...f, services: ids }))}
                error={errors.services}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="When?" icon={<CalendarPlus className="size-4.5" />} />
            <CardBody className="space-y-4">
              <FormRow>
                <Field label="Date" required error={errors.scheduledAt}>
                  <Input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  />
                </Field>
                <Field label="Time slot" required error={errors.slot}>
                  <Select
                    value={form.slot}
                    onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
                  >
                    {TIME_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FormRow>

              <Field
                label="Anything you want us to look at?"
                hint="This goes straight onto the job card."
              >
                <Textarea
                  rows={3}
                  value={form.concern}
                  onChange={(e) => setForm((f) => ({ ...f, concern: e.target.value }))}
                  placeholder="Slight vibration in the steering above 80 km/h."
                />
              </Field>

              <div className="rounded-xl border border-line bg-surface-2/40 p-4">
                <Checkbox
                  label="I need pickup and drop"
                  checked={form.pickupRequired}
                  onChange={(e) => setForm((f) => ({ ...f, pickupRequired: e.target.checked }))}
                />
                {form.pickupRequired ? (
                  <div className="mt-3">
                    <Field label="Pickup address">
                      <Textarea
                        rows={2}
                        value={form.pickupAddress}
                        onChange={(e) => setForm((f) => ({ ...f, pickupAddress: e.target.value }))}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card>
            <CardHeader title="Your estimate" />
            <CardBody>
              {chosen.length ? (
                <ul className="space-y-2.5">
                  {chosen.map((s) => (
                    <li key={s._id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 flex-1 text-muted">{s.name}</span>
                      <span className="font-semibold text-ink">
                        {formatCurrency(s.basePrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-subtle">Pick a service to see the estimate.</p>
              )}

              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Labour estimate</dt>
                  <dd className="font-semibold text-ink">{formatCurrency(estimate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="flex items-center gap-1 text-muted">
                    <Clock className="size-3.5" />
                    Workshop time
                  </dt>
                  <dd className="font-semibold text-ink">{hours || 0}h</dd>
                </div>
              </dl>

              <Button
                className="mt-5 w-full"
                loading={saving}
                disabled={!form.vehicle || !form.services.length}
                onClick={submit}
              >
                <CalendarPlus className="size-4" />
                Request booking
              </Button>

              <p className="mt-3 text-xs leading-relaxed text-subtle">
                Parts are quoted after inspection. Nothing gets replaced without your approval.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
