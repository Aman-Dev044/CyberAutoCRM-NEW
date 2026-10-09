'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ban, Check, Plus, Printer, Send, Wallet } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Field, FormRow, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { apiPatch, apiPost, type ApiClientError } from '@/lib/client';
import { PAYMENT_METHODS } from '@/lib/constants';
import { formatCurrency, formatDate, titleCase } from '@/lib/utils';

export type InvoiceDetail = {
  _id: string;
  number: string;
  status: string;
  issuedAt: string;
  dueDate?: string;
  lines: { description: string; qty: number; unitPrice: number; kind: string }[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  payments: { at: string; amount: number; method: string; reference?: string }[];
  customer?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    code?: string;
    company?: string;
    gstin?: string;
    address?: { line1?: string; city?: string; state?: string; pincode?: string };
  } | null;
  vehicle?: { registrationNumber: string; make: string; model: string; year?: number } | null;
  serviceOrder?: { _id: string; code: string; odometerIn?: number; odometerOut?: number } | null;
};

type Garage = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
};

export function InvoiceView({ invoice, garage }: { invoice: InvoiceDetail; garage: Garage }) {
  const router = useRouter();
  const toast = useToast();

  const [payOpen, setPayOpen] = useState(false);
  const [payment, setPayment] = useState({
    amount: String(invoice.balance > 0 ? invoice.balance : ''),
    method: 'CASH',
    reference: '',
  });
  const [saving, setSaving] = useState(false);

  const recordPayment = async () => {
    setSaving(true);
    try {
      await apiPost(`/api/invoices/${invoice._id}/payments`, {
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference,
      });
      toast.success('Payment recorded');
      setPayOpen(false);
      router.refresh();
    } catch (err) {
      toast.error('Could not record the payment', (err as ApiClientError).message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: string) => {
    try {
      await apiPatch(`/api/invoices/${invoice._id}`, { status });
      toast.success(`Invoice marked ${titleCase(status)}`);
      router.refresh();
    } catch (err) {
      toast.error('Update failed', (err as ApiClientError).message);
    }
  };

  const address = invoice.customer?.address;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
        {invoice.balance > 0 && invoice.status !== 'VOID' ? (
          <Button onClick={() => setPayOpen(true)}>
            <Wallet className="size-4" />
            Record payment
          </Button>
        ) : null}

        {invoice.status === 'DRAFT' ? (
          <Button variant="secondary" onClick={() => setStatus('SENT')}>
            <Send className="size-4" />
            Mark as sent
          </Button>
        ) : null}

        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print / PDF
        </Button>

        {invoice.serviceOrder ? (
          <Link
            href={`/admin/orders/${invoice.serviceOrder._id}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong px-5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Job card {invoice.serviceOrder.code}
          </Link>
        ) : null}

        {invoice.status !== 'VOID' && invoice.amountPaid === 0 ? (
          <Button variant="ghost" className="ml-auto" onClick={() => setStatus('VOID')}>
            <Ban className="size-4" />
            Void invoice
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        {/* Printable document */}
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-surface-2/40 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="font-display text-lg font-extrabold text-ink">{garage.name}</p>
                {garage.address ? (
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                    {garage.address}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  {garage.phone}
                  {garage.email ? ` · ${garage.email}` : ''}
                </p>
                {garage.gstin ? (
                  <p className="mt-1 font-mono text-xs text-muted">GSTIN: {garage.gstin}</p>
                ) : null}
              </div>

              <div className="text-right">
                <p className="text-xs font-bold tracking-[0.14em] text-subtle uppercase">
                  Tax invoice
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-ink">{invoice.number}</p>
                <div className="mt-2 flex justify-end">
                  <StatusBadge status={invoice.status} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  Issued {formatDate(invoice.issuedAt)}
                  {invoice.dueDate ? <> · Due {formatDate(invoice.dueDate)}</> : null}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line px-6 py-5 sm:grid-cols-2 sm:px-8">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-subtle uppercase">Billed to</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {invoice.customer?.company || invoice.customer?.name}
              </p>
              {invoice.customer?.company ? (
                <p className="text-xs text-muted">{invoice.customer.name}</p>
              ) : null}
              {address?.line1 ? (
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {address.line1}
                  {address.city ? `, ${address.city}` : ''}
                  {address.state ? `, ${address.state}` : ''}
                  {address.pincode ? ` — ${address.pincode}` : ''}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted">
                {invoice.customer?.phone}
                {invoice.customer?.email ? ` · ${invoice.customer.email}` : ''}
              </p>
              {invoice.customer?.gstin ? (
                <p className="mt-1 font-mono text-xs text-muted">
                  GSTIN: {invoice.customer.gstin}
                </p>
              ) : null}
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] font-bold tracking-wide text-subtle uppercase">Vehicle</p>
              <p className="mt-1.5 font-mono text-sm font-semibold text-ink">
                {invoice.vehicle?.registrationNumber ?? '—'}
              </p>
              <p className="text-xs text-muted">
                {invoice.vehicle?.make} {invoice.vehicle?.model}
                {invoice.vehicle?.year ? ` · ${invoice.vehicle.year}` : ''}
              </p>
              {invoice.serviceOrder ? (
                <p className="mt-1 text-xs text-muted">
                  Job card {invoice.serviceOrder.code}
                  {invoice.serviceOrder.odometerOut
                    ? ` · ${invoice.serviceOrder.odometerOut.toLocaleString('en-IN')} km`
                    : ''}
                </p>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/40">
                  <th className="px-6 py-2.5 text-left text-[11px] font-bold tracking-wider text-subtle uppercase sm:px-8">
                    Description
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold tracking-wider text-subtle uppercase">
                    Type
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-bold tracking-wider text-subtle uppercase">
                    Qty
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-bold tracking-wider text-subtle uppercase">
                    Rate
                  </th>
                  <th className="px-6 py-2.5 text-right text-[11px] font-bold tracking-wider text-subtle uppercase sm:px-8">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l, i) => (
                  <tr key={`${l.description}-${i}`} className="border-b border-line/70">
                    <td className="px-6 py-3 text-ink sm:px-8">{l.description}</td>
                    <td className="px-3 py-3 text-xs text-muted">{titleCase(l.kind)}</td>
                    <td className="px-3 py-3 text-right text-ink">{l.qty}</td>
                    <td className="px-3 py-3 text-right text-ink">
                      {formatCurrency(l.unitPrice)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-ink sm:px-8">
                      {formatCurrency(l.unitPrice * l.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end px-6 py-5 sm:px-8">
            <dl className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-ink">{formatCurrency(invoice.subtotal)}</dd>
              </div>
              {invoice.discount ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-danger">− {formatCurrency(invoice.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">GST ({invoice.taxRate}%)</dt>
                <dd className="text-ink">{formatCurrency(invoice.taxAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-display text-lg font-bold text-ink">
                  {formatCurrency(invoice.total)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Paid</dt>
                <dd className="text-success">{formatCurrency(invoice.amountPaid)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-semibold text-ink">Balance due</dt>
                <dd
                  className={`font-display text-lg font-bold ${invoice.balance > 0 ? 'text-warning' : 'text-success'}`}
                >
                  {formatCurrency(invoice.balance)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-line px-6 py-4 text-xs leading-relaxed text-muted sm:px-8">
            {invoice.notes ? <p className="mb-2">{invoice.notes}</p> : null}
            <p>
              Parts carry the manufacturer warranty; labour is warranted for 30 days or 1,000 km,
              whichever comes first. Thank you for trusting {garage.name}.
            </p>
          </div>
        </Card>

        {/* Payments */}
        <aside className="space-y-4 no-print">
          <Card>
            <CardHeader
              title="Payments"
              subtitle={`${invoice.payments.length} recorded`}
              icon={<Wallet className="size-4.5" />}
            />
            <CardBody>
              {invoice.payments.length ? (
                <ul className="space-y-3">
                  {invoice.payments.map((p, i) => (
                    <li key={`${p.at}-${i}`} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-success-soft text-success">
                        <Check className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-[11px] text-muted">
                          {titleCase(p.method)} · {formatDate(p.at, true)}
                        </p>
                        {p.reference ? (
                          <p className="font-mono text-[11px] text-subtle">{p.reference}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-subtle">No payments yet.</p>
              )}

              {invoice.balance > 0 && invoice.status !== 'VOID' ? (
                <Button className="mt-5 w-full" size="sm" onClick={() => setPayOpen(true)}>
                  <Plus className="size-4" />
                  Add payment
                </Button>
              ) : null}
            </CardBody>
          </Card>

          {invoice.customer ? (
            <Card>
              <CardHeader title="Customer" />
              <CardBody className="space-y-2 text-sm">
                <Link
                  href={`/admin/customers/${invoice.customer._id}`}
                  className="font-semibold text-brand hover:underline"
                >
                  {invoice.customer.name}
                </Link>
                <p className="text-muted">{invoice.customer.phone}</p>
                {invoice.customer.email ? (
                  <p className="break-all text-muted">{invoice.customer.email}</p>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record a payment"
        description={`Balance due ${formatCurrency(invoice.balance)}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={recordPayment}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <Field label="Amount (₹)" required>
              <Input
                type="number"
                value={payment.amount}
                onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                max={invoice.balance}
              />
            </Field>
            <Field label="Method">
              <Select
                value={payment.method}
                onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {titleCase(m)}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>
          <Field label="Reference" hint="UPI txn id, cheque number or card auth code.">
            <Input
              value={payment.reference}
              onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
