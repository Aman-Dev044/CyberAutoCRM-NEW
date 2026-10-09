'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarCheck,
  CalendarPlus,
  CheckCheck,
  Phone,
  Trash2,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { EntityPicker, MultiPicker } from '@/components/admin/EntityPicker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Checkbox, Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useCollection } from '@/hooks/useCollection';
import { apiDelete, apiGet, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { APPOINTMENT_STATUS, TIME_SLOTS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

type Row = {
  _id: string;
  code: string;
  scheduledAt: string;
  slot: string;
  status: string;
  source: string;
  estimatedCost: number;
  pickupRequired: boolean;
  concern?: string;
  serviceOrder?: string | null;
  customer?: { _id: string; name: string; phone: string } | null;
  vehicle?: { _id: string; registrationNumber: string; make: string; model: string } | null;
  services?: { _id: string; name: string }[];
  assignedTechnician?: { _id: string; name: string } | null;
};

type ServiceOption = { _id: string; name: string; basePrice: number; category: string };
type TechOption = { _id: string; name: string; openJobs: number };

const EMPTY_FORM = {
  customer: '',
  vehicle: '',
  services: [] as string[],
  scheduledAt: new Date().toISOString().slice(0, 10),
  slot: '10:00',
  status: 'CONFIRMED',
  assignedTechnician: '',
  concern: '',
  notes: '',
  pickupRequired: false,
  pickupAddress: '',
};

export default function AppointmentsPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();

  const list = useCollection<Row>('/api/appointments', {
    q: params.get('q') ?? '',
    status: params.get('status') ?? 'ALL',
  });

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [technicians, setTechnicians] = useState<TechOption[]>([]);
  const [modalOpen, setModalOpen] = useState(params.get('new') === '1');
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ items: ServiceOption[] }>('/api/services?limit=100&isActive=true')
      .then((r) => setServices(r.items))
      .catch(() => {});
    apiGet<{ items: TechOption[] }>('/api/technicians')
      .then((r) => setTechnicians(r.items))
      .catch(() => {});
  }, []);

  const serviceOptions = useMemo(
    () =>
      services.map((s) => ({
        id: s._id,
        label: s.name,
        sub: `${s.category} · ${formatCurrency(s.basePrice)}`,
      })),
    [services],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setErrors({});
    setForm({
      customer: row.customer?._id ?? '',
      vehicle: row.vehicle?._id ?? '',
      services: row.services?.map((s) => s._id) ?? [],
      scheduledAt: new Date(row.scheduledAt).toISOString().slice(0, 10),
      slot: row.slot,
      status: row.status,
      assignedTechnician: row.assignedTechnician?._id ?? '',
      concern: row.concern ?? '',
      notes: '',
      pickupRequired: row.pickupRequired,
      pickupAddress: '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        assignedTechnician: form.assignedTechnician || null,
      };
      if (editing) {
        await apiPatch(`/api/appointments/${editing._id}`, payload);
        toast.success('Appointment updated');
      } else {
        await apiPost('/api/appointments', { ...payload, source: 'ADMIN' });
        toast.success('Appointment booked');
      }
      setModalOpen(false);
      list.refresh();
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (row: Row, status: string) => {
    setBusyId(row._id);
    try {
      await apiPatch(`/api/appointments/${row._id}`, { status });
      toast.success(`${row.code} marked ${status.toLowerCase().replace('_', ' ')}`);
      list.refresh();
    } catch (err) {
      toast.error('Update failed', (err as ApiClientError).message);
    } finally {
      setBusyId(null);
    }
  };

  const convert = async (row: Row) => {
    setBusyId(row._id);
    try {
      const res = await apiPost<{ order: { _id: string; code: string } }>(
        `/api/appointments/${row._id}/convert`,
        {},
      );
      toast.success('Job card opened', res.order.code);
      router.push(`/admin/orders/${res.order._id}`);
    } catch (err) {
      toast.error('Could not open a job card', (err as ApiClientError).message);
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/appointments/${deleteTarget._id}`);
      toast.success('Appointment deleted');
      setDeleteTarget(null);
      list.refresh();
    } catch (err) {
      toast.error('Delete failed', (err as ApiClientError).message);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: 'code',
      header: 'Booking',
      render: (r) => (
        <div>
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="font-mono text-xs font-bold text-brand hover:underline"
          >
            {r.code}
          </button>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-subtle">
            {r.source === 'ONLINE' ? 'Online' : r.source === 'PHONE' ? 'Phone' : r.source === 'WALK_IN' ? 'Walk-in' : 'Front desk'}
            {r.pickupRequired ? (
              <span title="Pickup requested">
                <Truck className="size-3 text-brand" />
              </span>
            ) : null}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{r.customer?.name ?? '—'}</p>
          {r.customer?.phone ? (
            <a
              href={`tel:${r.customer.phone}`}
              className="flex items-center gap-1 text-[11px] text-muted hover:text-brand"
            >
              <Phone className="size-3" />
              {r.customer.phone}
            </a>
          ) : null}
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      hideBelow: 'md',
      render: (r) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-ink">
            {r.vehicle?.registrationNumber ?? '—'}
          </p>
          <p className="truncate text-[11px] text-muted">
            {r.vehicle?.make} {r.vehicle?.model}
          </p>
        </div>
      ),
    },
    {
      key: 'when',
      header: 'Scheduled',
      render: (r) => (
        <div>
          <p className="text-sm text-ink">{formatDate(r.scheduledAt)}</p>
          <p className="text-[11px] text-muted">{r.slot}</p>
        </div>
      ),
    },
    {
      key: 'services',
      header: 'Services',
      hideBelow: 'lg',
      render: (r) => (
        <div className="max-w-56">
          <p className="truncate text-xs text-muted">
            {r.services?.map((s) => s.name).join(', ') || '—'}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-ink">
            {formatCurrency(r.estimatedCost)}
          </p>
        </div>
      ),
    },
    {
      key: 'tech',
      header: 'Technician',
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-xs text-muted">{r.assignedTechnician?.name ?? 'Unassigned'}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.status === 'PENDING' ? (
            <button
              type="button"
              disabled={busyId === r._id}
              onClick={() => setStatus(r, 'CONFIRMED')}
              className="rounded-lg p-1.5 text-muted transition hover:bg-success-soft hover:text-success disabled:opacity-40"
              title="Confirm booking"
            >
              <CheckCheck className="size-4" />
            </button>
          ) : null}

          {!r.serviceOrder && !['CANCELLED', 'NO_SHOW'].includes(r.status) ? (
            <button
              type="button"
              disabled={busyId === r._id}
              onClick={() => convert(r)}
              className="rounded-lg p-1.5 text-muted transition hover:bg-brand-soft hover:text-brand disabled:opacity-40"
              title="Open a job card"
            >
              <Wrench className="size-4" />
            </button>
          ) : null}

          {r.serviceOrder ? (
            <Link
              href={`/admin/orders/${r.serviceOrder}`}
              className="rounded-lg p-1.5 text-brand transition hover:bg-brand-soft"
              title="View job card"
            >
              <Wrench className="size-4" />
            </Link>
          ) : null}

          {!['CANCELLED', 'COMPLETED'].includes(r.status) ? (
            <button
              type="button"
              disabled={busyId === r._id}
              onClick={() => setStatus(r, 'CANCELLED')}
              className="rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-40"
              title="Cancel"
            >
              <X className="size-4" />
            </button>
          ) : null}

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
        title="Appointments"
        description="Every booking from the website, phone and front desk in one queue."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Appointments' }]}
        action={
          <Button onClick={openCreate}>
            <CalendarPlus className="size-4" />
            New appointment
          </Button>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Search bookings…"
          />
          <FilterSelect
            label="Status"
            value={String(list.params.status ?? 'ALL')}
            onChange={(v) => list.setParam('status', v)}
            options={APPOINTMENT_STATUS}
          />
          <label className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
              From
            </span>
            <input
              type="date"
              value={String(list.params.from ?? '')}
              onChange={(e) => list.setParam('from', e.target.value)}
              className="h-10 rounded-xl border border-line bg-surface-2/60 px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wide text-subtle uppercase">To</span>
            <input
              type="date"
              value={String(list.params.to ?? '')}
              onChange={(e) => list.setParam('to', e.target.value)}
              className="h-10 rounded-xl border border-line bg-surface-2/60 px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          emptyTitle="No appointments found"
          emptyMessage="Try clearing the filters, or book one from the front desk."
        />

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          onPage={(p) => list.setParam('page', p)}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.code}` : 'New appointment'}
        description={
          editing
            ? 'Update the slot, services or assignment.'
            : 'Book on behalf of a customer who called or walked in.'
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              {editing ? 'Save changes' : 'Book appointment'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <EntityPicker
              label="Customer"
              required
              endpoint="/api/customers"
              value={form.customer}
              error={errors.customer}
              onChange={(id) => setForm((f) => ({ ...f, customer: id, vehicle: '' }))}
              placeholder="Search by name or phone"
              toOption={(row) => ({
                id: String(row._id),
                label: String(row.name),
                sub: String(row.phone ?? ''),
              })}
            />
            <EntityPicker
              label="Vehicle"
              required
              endpoint="/api/vehicles"
              value={form.vehicle}
              error={errors.vehicle}
              disabled={!form.customer}
              extraParams={{ customer: form.customer || undefined }}
              onChange={(id) => setForm((f) => ({ ...f, vehicle: id }))}
              placeholder={form.customer ? 'Pick a vehicle' : 'Choose a customer first'}
              emptyHint="No vehicles on this customer"
              toOption={(row) => ({
                id: String(row._id),
                label: String(row.registrationNumber),
                sub: `${row.make} ${row.model}`,
              })}
            />
          </FormRow>

          <MultiPicker
            label="Services"
            required
            error={errors.services}
            options={serviceOptions}
            value={form.services}
            onChange={(ids) => setForm((f) => ({ ...f, services: ids }))}
          />

          <FormRow cols={3}>
            <Field label="Date" required error={errors.scheduledAt}>
              <Input
                type="date"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              />
            </Field>
            <Field label="Slot" required error={errors.slot}>
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
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {APPOINTMENT_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <Field label="Assign technician" hint="Optional — the floor manager can assign later.">
            <Select
              value={form.assignedTechnician}
              onChange={(e) => setForm((f) => ({ ...f, assignedTechnician: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} · {t.openJobs} open
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Customer concern" error={errors.concern}>
            <Textarea
              rows={3}
              value={form.concern}
              onChange={(e) => setForm((f) => ({ ...f, concern: e.target.value }))}
              placeholder="What did they report?"
            />
          </Field>

          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <Checkbox
              label="Pickup and drop required"
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
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.code ?? 'appointment'}?`}
        message="This removes the booking permanently. Any job card already opened from it stays."
      />

      {!list.loading && !list.items.length && !list.params.q ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-subtle">
          <CalendarCheck className="size-3.5" />
          Tip: public bookings land here as “Pending” until someone confirms them.
        </p>
      ) : null}
    </>
  );
}
