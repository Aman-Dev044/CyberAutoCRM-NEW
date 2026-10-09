'use client';

import { useState } from 'react';
import { AlertTriangle, CarFront, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { EntityPicker } from '@/components/admin/EntityPicker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useCollection } from '@/hooks/useCollection';
import { apiDelete, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { FUEL_TYPES, TRANSMISSIONS } from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/utils';

type Row = {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  fuelType: string;
  transmission: string;
  vin?: string;
  odometer: number;
  serviceCount: number;
  lastServiceAt?: string;
  insuranceProvider?: string;
  insuranceExpiry?: string;
  pucExpiry?: string;
  notes?: string;
  customer?: { _id: string; name: string; phone: string } | null;
};

const EMPTY = {
  customer: '',
  registrationNumber: '',
  make: '',
  model: '',
  variant: '',
  year: String(new Date().getFullYear() - 2),
  color: '',
  fuelType: 'Petrol',
  transmission: 'Manual',
  vin: '',
  odometer: '0',
  insuranceProvider: '',
  insuranceExpiry: '',
  pucExpiry: '',
  notes: '',
};

const isExpiringSoon = (date?: string) => {
  if (!date) return false;
  const days = (new Date(date).getTime() - Date.now()) / 86400000;
  return days < 30;
};

export default function VehiclesPage() {
  const toast = useToast();
  const list = useCollection<Row>('/api/vehicles');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setErrors({});
    setForm({
      customer: row.customer?._id ?? '',
      registrationNumber: row.registrationNumber,
      make: row.make,
      model: row.model,
      variant: row.variant ?? '',
      year: String(row.year),
      color: row.color ?? '',
      fuelType: row.fuelType,
      transmission: row.transmission,
      vin: row.vin ?? '',
      odometer: String(row.odometer),
      insuranceProvider: row.insuranceProvider ?? '',
      insuranceExpiry: row.insuranceExpiry?.slice(0, 10) ?? '',
      pucExpiry: row.pucExpiry?.slice(0, 10) ?? '',
      notes: row.notes ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form, year: Number(form.year), odometer: Number(form.odometer) };
      if (editing) {
        await apiPatch(`/api/vehicles/${editing._id}`, payload);
        toast.success('Vehicle updated');
      } else {
        await apiPost('/api/vehicles', payload);
        toast.success('Vehicle added');
      }
      setOpen(false);
      list.refresh();
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/vehicles/${deleteTarget._id}`);
      toast.success('Vehicle deleted');
      setDeleteTarget(null);
      list.refresh();
    } catch (err) {
      toast.error('Delete failed', (err as ApiClientError).message);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: 'reg',
      header: 'Vehicle',
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand">
            <CarFront className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-ink">{r.registrationNumber}</p>
            <p className="truncate text-[11px] text-muted">
              {r.make} {r.model} {r.variant ? `· ${r.variant}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{r.customer?.name ?? '—'}</p>
          <p className="text-[11px] text-muted">{r.customer?.phone}</p>
        </div>
      ),
    },
    {
      key: 'spec',
      header: 'Spec',
      hideBelow: 'md',
      render: (r) => (
        <div className="text-xs text-muted">
          <p>
            {r.year} · {r.fuelType}
          </p>
          <p className="text-subtle">{r.transmission}</p>
        </div>
      ),
    },
    {
      key: 'odo',
      header: 'Odometer',
      hideBelow: 'md',
      render: (r) => (
        <div>
          <p className="text-sm text-ink">{formatNumber(r.odometer)} km</p>
          <p className="text-[11px] text-subtle">
            {r.serviceCount} service{r.serviceCount === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    {
      key: 'docs',
      header: 'Documents',
      hideBelow: 'lg',
      render: (r) => (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            Insurance:
            {r.insuranceExpiry ? (
              <Badge tone={isExpiringSoon(r.insuranceExpiry) ? 'danger' : 'neutral'}>
                {formatDate(r.insuranceExpiry)}
              </Badge>
            ) : (
              <span className="text-subtle">—</span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            PUC:
            {r.pucExpiry ? (
              <Badge tone={isExpiringSoon(r.pucExpiry) ? 'danger' : 'neutral'}>
                {formatDate(r.pucExpiry)}
              </Badge>
            ) : (
              <span className="text-subtle">—</span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'lastService',
      header: 'Last service',
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-xs text-muted">
          {r.lastServiceAt ? formatDate(r.lastServiceAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
            title="Edit"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="The fleet you look after — with insurance and PUC expiry in plain sight."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Vehicles' }]}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add vehicle
          </Button>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Registration, make or model…"
          />
          <FilterSelect
            label="Fuel"
            value={String(list.params.fuelType ?? 'ALL')}
            onChange={(v) => list.setParam('fuelType', v)}
            options={FUEL_TYPES}
          />
          <FilterSelect
            label="Gearbox"
            value={String(list.params.transmission ?? 'ALL')}
            onChange={(v) => list.setParam('transmission', v)}
            options={TRANSMISSIONS}
          />
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          emptyTitle="No vehicles found"
          emptyMessage="Add a vehicle against a customer to get started."
        />

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          onPage={(p) => list.setParam('page', p)}
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.registrationNumber}` : 'Add vehicle'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              {editing ? 'Save changes' : 'Add vehicle'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <EntityPicker
            label="Owner"
            required
            endpoint="/api/customers"
            value={form.customer}
            error={errors.customer}
            onChange={(id) => setForm((f) => ({ ...f, customer: id }))}
            placeholder="Search customers"
            toOption={(row) => ({
              id: String(row._id),
              label: String(row.name),
              sub: String(row.phone ?? ''),
            })}
          />

          <FormRow>
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
            <Field label="VIN / chassis">
              <Input
                value={form.vin}
                onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value.toUpperCase() }))}
                className="font-mono uppercase"
              />
            </Field>
          </FormRow>

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
            <Field label="Variant">
              <Input
                value={form.variant}
                onChange={(e) => setForm((f) => ({ ...f, variant: e.target.value }))}
                placeholder="SX(O)"
              />
            </Field>
          </FormRow>

          <FormRow cols={4}>
            <Field label="Year" required error={errors.year}>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
            </Field>
            <Field label="Colour">
              <Input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              />
            </Field>
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
          </FormRow>

          <FormRow cols={3}>
            <Field label="Odometer (km)">
              <Input
                type="number"
                value={form.odometer}
                onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
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

          <Field label="Insurance provider">
            <Input
              value={form.insuranceProvider}
              onChange={(e) => setForm((f) => ({ ...f, insuranceProvider: e.target.value }))}
            />
          </Field>

          <Field label="Notes" hint="Known quirks, accident history, customer preferences.">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.registrationNumber ?? 'vehicle'}?`}
        message="Past job cards remain, but this vehicle will no longer be bookable."
      />

      <p className="mt-4 flex items-center gap-2 text-xs text-subtle">
        <AlertTriangle className="size-3.5 text-warning" />
        Documents expiring within 30 days are highlighted in red — a good list to call through.
      </p>
    </>
  );
}
