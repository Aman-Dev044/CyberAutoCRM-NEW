'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Gauge,
  Plus,
  Printer,
  Save,
  Trash2,
  Wrench,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Checkbox, Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { EntityPicker, MultiPicker } from '@/components/admin/EntityPicker';
import { apiGet, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { ORDER_PRIORITY, ORDER_STATUS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

type Line = { service?: string | null; name: string; price: number; hours: number; qty: number };
type PartLine = { part?: string | null; name: string; sku?: string; qty: number; unitPrice: number };

export type OrderDetail = {
  _id: string;
  code: string;
  status: string;
  priority: string;
  customer?: { _id: string; name: string; phone?: string } | null;
  vehicle?: { _id: string; registrationNumber: string; make: string; model: string; odometer?: number } | null;
  technicians?: { _id: string; name: string }[];
  items: Line[];
  parts: PartLine[];
  complaint?: string;
  diagnosis?: string;
  recommendation?: string;
  odometerIn: number;
  odometerOut?: number;
  fuelLevel?: string;
  discount: number;
  taxRate: number;
  laborTotal: number;
  partsTotal: number;
  taxAmount: number;
  grandTotal: number;
  estimateApproved: boolean;
  promisedAt?: string;
  createdAt?: string;
  invoice?: { _id: string; number: string; status: string; balance: number } | null;
  workLog?: { at: string; byName?: string; status?: string; note: string }[];
};

type ServiceOption = { _id: string; name: string; basePrice: number; estimatedHours: number; category: string };
type PartOption = { _id: string; name: string; sku: string; unitPrice: number; stockQty: number };
type TechOption = { _id: string; name: string; openJobs: number; technician?: { specialization?: string } };

export function JobCardForm({ order }: { order?: OrderDetail }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!order;

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [technicians, setTechnicians] = useState<TechOption[]>([]);

  const [form, setForm] = useState({
    customer: order?.customer?._id ?? '',
    vehicle: order?.vehicle?._id ?? '',
    priority: order?.priority ?? 'NORMAL',
    status: order?.status ?? 'OPEN',
    technicians: order?.technicians?.map((t) => t._id) ?? [],
    complaint: order?.complaint ?? '',
    diagnosis: order?.diagnosis ?? '',
    recommendation: order?.recommendation ?? '',
    odometerIn: String(order?.odometerIn ?? 0),
    odometerOut: order?.odometerOut ? String(order.odometerOut) : '',
    fuelLevel: order?.fuelLevel ?? '1/2',
    discount: String(order?.discount ?? 0),
    taxRate: String(order?.taxRate ?? 18),
    estimateApproved: order?.estimateApproved ?? false,
    promisedAt: order?.promisedAt ? new Date(order.promisedAt).toISOString().slice(0, 10) : '',
    workNote: '',
  });

  const [items, setItems] = useState<Line[]>(order?.items ?? []);
  const [partLines, setPartLines] = useState<PartLine[]>(order?.parts ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [invoicing, setInvoicing] = useState(false);

  useEffect(() => {
    apiGet<{ items: ServiceOption[] }>('/api/services?limit=100&isActive=true')
      .then((r) => setServices(r.items))
      .catch(() => {});
    apiGet<{ items: PartOption[] }>('/api/parts?limit=100&isActive=true')
      .then((r) => setParts(r.items))
      .catch(() => {});
    apiGet<{ items: TechOption[] }>('/api/technicians')
      .then((r) => setTechnicians(r.items))
      .catch(() => {});
  }, []);

  const laborTotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const partsTotal = partLines.reduce((s, p) => s + p.unitPrice * (p.qty || 1), 0);
  const discount = Number(form.discount) || 0;
  const taxable = Math.max(0, laborTotal + partsTotal - discount);
  const taxAmount = Math.round((taxable * (Number(form.taxRate) || 0)) / 100);
  const grandTotal = taxable + taxAmount;

  const techOptions = useMemo(
    () =>
      technicians.map((t) => ({
        id: t._id,
        label: t.name,
        sub: `${t.technician?.specialization ?? 'General'} · ${t.openJobs} open`,
      })),
    [technicians],
  );

  const addService = (id: string) => {
    const s = services.find((x) => x._id === id);
    if (!s) return;
    setItems((prev) => [
      ...prev,
      { service: s._id, name: s.name, price: s.basePrice, hours: s.estimatedHours, qty: 1 },
    ]);
  };

  const addPart = (id: string) => {
    const p = parts.find((x) => x._id === id);
    if (!p) return;
    setPartLines((prev) => [
      ...prev,
      { part: p._id, name: p.name, sku: p.sku, qty: 1, unitPrice: p.unitPrice },
    ]);
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        customer: form.customer,
        vehicle: form.vehicle,
        priority: form.priority,
        status: form.status,
        technicians: form.technicians,
        items,
        parts: partLines,
        complaint: form.complaint,
        diagnosis: form.diagnosis,
        recommendation: form.recommendation,
        odometerIn: Number(form.odometerIn) || 0,
        ...(form.odometerOut ? { odometerOut: Number(form.odometerOut) } : {}),
        fuelLevel: form.fuelLevel,
        discount,
        taxRate: Number(form.taxRate) || 0,
        estimateApproved: form.estimateApproved,
        ...(form.promisedAt ? { promisedAt: form.promisedAt } : {}),
        ...(isEdit && form.workNote ? { workNote: form.workNote } : {}),
      };

      if (isEdit) {
        await apiPatch(`/api/orders/${order!._id}`, payload);
        toast.success('Job card saved');
        setForm((f) => ({ ...f, workNote: '' }));
        router.refresh();
      } else {
        const created = await apiPost<{ _id: string; code: string }>('/api/orders', payload);
        toast.success('Job card created', created.code);
        router.replace(`/admin/orders/${created._id}`);
      }
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not save the job card', e.message);
    } finally {
      setSaving(false);
    }
  };

  const generateInvoice = async () => {
    if (!order) return;
    setInvoicing(true);
    try {
      const inv = await apiPost<{ _id: string; number: string }>(
        `/api/orders/${order._id}/invoice`,
        {},
      );
      toast.success('Invoice raised', inv.number);
      router.push(`/admin/invoices/${inv._id}`);
    } catch (err) {
      toast.error('Could not raise an invoice', (err as ApiClientError).message);
      setInvoicing(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        {/* Who + what */}
        <Card>
          <CardHeader title="Vehicle & customer" icon={<Gauge className="size-4.5" />} />
          <CardBody className="space-y-4">
            <FormRow>
              <EntityPicker
                label="Customer"
                required
                endpoint="/api/customers"
                value={form.customer}
                error={errors.customer}
                disabled={isEdit}
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
                disabled={isEdit || !form.customer}
                extraParams={{ customer: form.customer || undefined }}
                onChange={(id) => setForm((f) => ({ ...f, vehicle: id }))}
                placeholder={form.customer ? 'Pick a vehicle' : 'Choose a customer first'}
                toOption={(row) => ({
                  id: String(row._id),
                  label: String(row.registrationNumber),
                  sub: `${row.make} ${row.model}`,
                })}
              />
            </FormRow>

            <FormRow cols={4}>
              <Field label="Odometer in (km)" error={errors.odometerIn}>
                <Input
                  type="number"
                  value={form.odometerIn}
                  onChange={(e) => setForm((f) => ({ ...f, odometerIn: e.target.value }))}
                />
              </Field>
              <Field label="Odometer out (km)">
                <Input
                  type="number"
                  value={form.odometerOut}
                  onChange={(e) => setForm((f) => ({ ...f, odometerOut: e.target.value }))}
                  placeholder="On delivery"
                />
              </Field>
              <Field label="Fuel level">
                <Select
                  value={form.fuelLevel}
                  onChange={(e) => setForm((f) => ({ ...f, fuelLevel: e.target.value }))}
                >
                  {['Empty', '1/4', '1/2', '3/4', 'Full'].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Promised by">
                <Input
                  type="date"
                  value={form.promisedAt}
                  onChange={(e) => setForm((f) => ({ ...f, promisedAt: e.target.value }))}
                />
              </Field>
            </FormRow>
          </CardBody>
        </Card>

        {/* Complaint and diagnosis */}
        <Card>
          <CardHeader title="Inspection" icon={<AlertCircle className="size-4.5" />} />
          <CardBody className="space-y-4">
            <Field label="Customer complaint" error={errors.complaint}>
              <Textarea
                rows={3}
                value={form.complaint}
                onChange={(e) => setForm((f) => ({ ...f, complaint: e.target.value }))}
                placeholder="What the customer reported, in their words."
              />
            </Field>
            <Field label="Technician diagnosis" error={errors.diagnosis}>
              <Textarea
                rows={3}
                value={form.diagnosis}
                onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                placeholder="What was actually found on inspection."
              />
            </Field>
            <Field
              label="Recommendation"
              hint="Advisory work the customer declined or should plan for."
            >
              <Textarea
                rows={2}
                value={form.recommendation}
                onChange={(e) => setForm((f) => ({ ...f, recommendation: e.target.value }))}
              />
            </Field>
          </CardBody>
        </Card>

        {/* Labour lines */}
        <Card>
          <CardHeader
            title="Labour"
            subtitle={`${items.length} line${items.length === 1 ? '' : 's'} · ${formatCurrency(laborTotal)}`}
            icon={<Wrench className="size-4.5" />}
            action={
              <Select
                value=""
                onChange={(e) => e.target.value && addService(e.target.value)}
                className="h-9 w-48 text-xs"
              >
                <option value="">+ Add a service…</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} — {formatCurrency(s.basePrice)}
                  </option>
                ))}
              </Select>
            }
          />
          <CardBody className="space-y-2.5">
            {items.map((line, i) => (
              <div
                key={`${line.name}-${i}`}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-line bg-surface-2/40 p-2.5"
              >
                <Input
                  className="col-span-12 sm:col-span-5"
                  value={line.name}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((l, idx) => (idx === i ? { ...l, name: e.target.value } : l)),
                    )
                  }
                  placeholder="Labour description"
                />
                <Input
                  className="col-span-4 sm:col-span-2"
                  type="number"
                  step="0.25"
                  value={line.hours}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((l, idx) =>
                        idx === i ? { ...l, hours: Number(e.target.value) } : l,
                      ),
                    )
                  }
                  placeholder="Hrs"
                />
                <Input
                  className="col-span-3 sm:col-span-1"
                  type="number"
                  min={1}
                  value={line.qty}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((l, idx) => (idx === i ? { ...l, qty: Number(e.target.value) } : l)),
                    )
                  }
                  placeholder="Qty"
                />
                <Input
                  className="col-span-4 sm:col-span-3"
                  type="number"
                  value={line.price}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((l, idx) =>
                        idx === i ? { ...l, price: Number(e.target.value) } : l,
                      ),
                    )
                  }
                  placeholder="Price"
                />
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="col-span-1 grid place-items-center rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger"
                  aria-label="Remove line"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setItems((prev) => [...prev, { name: '', price: 0, hours: 1, qty: 1, service: null }])
              }
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
            >
              <Plus className="size-3.5" />
              Add a custom labour line
            </button>
          </CardBody>
        </Card>

        {/* Parts */}
        <Card>
          <CardHeader
            title="Parts"
            subtitle={`${partLines.length} line${partLines.length === 1 ? '' : 's'} · ${formatCurrency(partsTotal)}`}
            icon={<FileText className="size-4.5" />}
            action={
              <Select
                value=""
                onChange={(e) => e.target.value && addPart(e.target.value)}
                className="h-9 w-48 text-xs"
              >
                <option value="">+ Add a part…</option>
                {parts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.sku} — {p.name} ({p.stockQty} in stock)
                  </option>
                ))}
              </Select>
            }
          />
          <CardBody className="space-y-2.5">
            {partLines.map((line, i) => (
              <div
                key={`${line.sku}-${i}`}
                className="grid grid-cols-12 items-center gap-2 rounded-xl border border-line bg-surface-2/40 p-2.5"
              >
                <Input
                  className="col-span-12 sm:col-span-6"
                  value={line.name}
                  onChange={(e) =>
                    setPartLines((prev) =>
                      prev.map((l, idx) => (idx === i ? { ...l, name: e.target.value } : l)),
                    )
                  }
                  placeholder="Part name"
                />
                <Input
                  className="col-span-4 sm:col-span-2"
                  value={line.sku ?? ''}
                  onChange={(e) =>
                    setPartLines((prev) =>
                      prev.map((l, idx) => (idx === i ? { ...l, sku: e.target.value } : l)),
                    )
                  }
                  placeholder="SKU"
                />
                <Input
                  className="col-span-3 sm:col-span-1"
                  type="number"
                  min={1}
                  value={line.qty}
                  onChange={(e) =>
                    setPartLines((prev) =>
                      prev.map((l, idx) => (idx === i ? { ...l, qty: Number(e.target.value) } : l)),
                    )
                  }
                />
                <Input
                  className="col-span-4 sm:col-span-2"
                  type="number"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setPartLines((prev) =>
                      prev.map((l, idx) =>
                        idx === i ? { ...l, unitPrice: Number(e.target.value) } : l,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => setPartLines((prev) => prev.filter((_, idx) => idx !== i))}
                  className="col-span-1 grid place-items-center rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger"
                  aria-label="Remove part"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setPartLines((prev) => [...prev, { name: '', sku: '', qty: 1, unitPrice: 0, part: null }])
              }
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
            >
              <Plus className="size-3.5" />
              Add an off-catalogue part
            </button>
          </CardBody>
        </Card>

        {/* Work log */}
        {isEdit ? (
          <Card>
            <CardHeader
              title="Work log"
              subtitle="Every status change and note, in order"
              icon={<CheckCircle2 className="size-4.5" />}
            />
            <CardBody>
              <Field label="Add a note" hint="Saved with the next status change or save.">
                <Textarea
                  rows={2}
                  value={form.workNote}
                  onChange={(e) => setForm((f) => ({ ...f, workNote: e.target.value }))}
                  placeholder="Pads replaced, discs skimmed, road tested."
                />
              </Field>

              <ol className="mt-5 space-y-4">
                {[...(order?.workLog ?? [])].reverse().map((w, i) => (
                  <li key={`${w.at}-${i}`} className="flex gap-3.5">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {w.status ? <StatusBadge status={w.status} /> : null}
                        <span className="text-[11px] text-subtle">
                          {formatDate(w.at, true)}
                          {w.byName ? ` · ${w.byName}` : ''}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{w.note}</p>
                    </div>
                  </li>
                ))}
                {!order?.workLog?.length ? (
                  <li className="text-sm text-subtle">No entries yet.</li>
                ) : null}
              </ol>
            </CardBody>
          </Card>
        ) : null}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader title="Status & assignment" />
          <CardBody className="space-y-4">
            <FormRow>
              <Field label="Stage">
                <Select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {ORDER_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  {ORDER_PRIORITY.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormRow>

            <MultiPicker
              label="Technicians"
              columns={1}
              options={techOptions}
              value={form.technicians}
              onChange={(ids) => setForm((f) => ({ ...f, technicians: ids }))}
            />

            <Checkbox
              label="Customer approved the estimate"
              checked={form.estimateApproved}
              onChange={(e) => setForm((f) => ({ ...f, estimateApproved: e.target.checked }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Costing" />
          <CardBody className="space-y-3">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Labour</dt>
                <dd className="font-semibold text-ink">{formatCurrency(laborTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Parts</dt>
                <dd className="font-semibold text-ink">{formatCurrency(partsTotal)}</dd>
              </div>
            </dl>

            <FormRow>
              <Field label="Discount">
                <Input
                  type="number"
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                />
              </Field>
              <Field label="Tax %">
                <Input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
                />
              </Field>
            </FormRow>

            <dl className="space-y-2 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="font-semibold text-ink">{formatCurrency(taxAmount)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <dt className="font-semibold text-ink">Grand total</dt>
                <dd className="font-display text-xl font-bold text-brand">
                  {formatCurrency(grandTotal)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-2.5">
          <Button className="w-full" loading={saving} onClick={save}>
            <Save className="size-4" />
            {isEdit ? 'Save job card' : 'Create job card'}
          </Button>

          {isEdit && !order?.invoice ? (
            <Button
              variant="secondary"
              className="w-full"
              loading={invoicing}
              onClick={generateInvoice}
            >
              <FileText className="size-4" />
              Raise invoice
            </Button>
          ) : null}

          {order?.invoice ? (
            <Link
              href={`/admin/invoices/${order.invoice._id}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              <FileText className="size-4" />
              {order.invoice.number} · {order.invoice.status}
            </Link>
          ) : null}

          {isEdit ? (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
              Print job card
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
