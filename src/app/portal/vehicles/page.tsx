'use client';

import { useEffect, useState } from 'react';
import { CarFront, Clock, Plus, ShieldAlert } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiGet, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { FUEL_TYPES, TRANSMISSIONS } from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/utils';

type Vehicle = {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  fuelType: string;
  transmission: string;
  odometer: number;
  serviceCount: number;
  lastServiceAt?: string;
  nextServiceDue?: string;
  insuranceProvider?: string;
  insuranceExpiry?: string;
  pucExpiry?: string;
  notes?: string;
};

const EMPTY = {
  registrationNumber: '',
  make: '',
  model: '',
  variant: '',
  year: String(new Date().getFullYear() - 2),
  color: '',
  fuelType: 'Petrol',
  transmission: 'Manual',
  odometer: '0',
  insuranceProvider: '',
  insuranceExpiry: '',
  pucExpiry: '',
  notes: '',
};

const expiryTone = (date?: string) => {
  if (!date) return 'neutral' as const;
  const days = (new Date(date).getTime() - Date.now()) / 86400000;
  if (days < 0) return 'danger' as const;
  if (days < 30) return 'warning' as const;
  return 'success' as const;
};

export default function PortalVehiclesPage() {
  const toast = useToast();
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet<{ items: Vehicle[] }>('/api/portal/vehicles')
      .then((r) => setItems(r.items))
      .catch((err) => toast.error('Could not load your vehicles', (err as ApiClientError).message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      await apiPost('/api/portal/vehicles', {
        ...form,
        year: Number(form.year),
        odometer: Number(form.odometer),
      });
      toast.success('Vehicle added');
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not add the vehicle', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">My vehicles</h1>
          <p className="mt-1.5 text-sm text-muted">
            Keep these up to date and we will remind you before anything expires.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add vehicle
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((v) => (
            <Card key={v._id}>
              <CardHeader
                title={<span className="font-mono">{v.registrationNumber}</span>}
                subtitle={`${v.make} ${v.model}${v.variant ? ` · ${v.variant}` : ''} · ${v.year}`}
                icon={<CarFront className="size-4.5" />}
              />
              <CardBody className="space-y-4">
                <dl className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <dt className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
                      Odometer
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-ink">
                      {formatNumber(v.odometer)} km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
                      Services
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-ink">{v.serviceCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
                      Fuel
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-ink">{v.fuelType}</dd>
                  </div>
                </dl>

                <div className="space-y-2 border-t border-line pt-4 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted">
                      <ShieldAlert className="size-3.5" />
                      Insurance
                    </span>
                    {v.insuranceExpiry ? (
                      <Badge tone={expiryTone(v.insuranceExpiry)}>
                        {formatDate(v.insuranceExpiry)}
                      </Badge>
                    ) : (
                      <span className="text-subtle">Not recorded</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted">
                      <ShieldAlert className="size-3.5" />
                      PUC
                    </span>
                    {v.pucExpiry ? (
                      <Badge tone={expiryTone(v.pucExpiry)}>{formatDate(v.pucExpiry)}</Badge>
                    ) : (
                      <span className="text-subtle">Not recorded</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted">
                      <Clock className="size-3.5" />
                      Next service
                    </span>
                    <span className="text-ink">
                      {v.nextServiceDue ? formatDate(v.nextServiceDue) : '—'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<CarFront className="size-6" />}
            title="No vehicles yet"
            message="Add your car and booking a service takes seconds."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                Add your first vehicle
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a vehicle"
        description="Only the registration, make, model and year are required."
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              Add vehicle
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Registration number" required error={errors.registrationNumber}>
            <Input
              value={form.registrationNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, registrationNumber: e.target.value.toUpperCase() }))
              }
              className="font-mono uppercase"
              placeholder="CH01AB1234"
            />
          </Field>

          <FormRow cols={3}>
            <Field label="Make" required error={errors.make}>
              <Input
                value={form.make}
                onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                placeholder="Hyundai"
              />
            </Field>
            <Field label="Model" required error={errors.model}>
              <Input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="Creta"
              />
            </Field>
            <Field label="Year" required error={errors.year}>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
            </Field>
          </FormRow>

          <FormRow cols={3}>
            <Field label="Fuel">
              <Select
                value={form.fuelType}
                onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Transmission">
              <Select
                value={form.transmission}
                onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))}
              >
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Odometer (km)">
              <Input
                type="number"
                value={form.odometer}
                onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
              />
            </Field>
          </FormRow>

          <FormRow cols={3}>
            <Field label="Insurance provider">
              <Input
                value={form.insuranceProvider}
                onChange={(e) => setForm((f) => ({ ...f, insuranceProvider: e.target.value }))}
              />
            </Field>
            <Field label="Insurance expiry">
              <Input
                type="date"
                value={form.insuranceExpiry}
                onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))}
              />
            </Field>
            <Field label="PUC expiry">
              <Input
                type="date"
                value={form.pucExpiry}
                onChange={(e) => setForm((f) => ({ ...f, pucExpiry: e.target.value }))}
              />
            </Field>
          </FormRow>

          <Field label="Anything we should know?">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Aftermarket stereo, previous accident repair on the left door…"
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
