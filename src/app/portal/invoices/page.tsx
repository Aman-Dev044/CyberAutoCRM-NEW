'use client';

import { useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/Stat';
import { useCollection } from '@/hooks/useCollection';
import { formatCurrency, formatDate, titleCase } from '@/lib/utils';

type Row = {
  _id: string;
  number: string;
  status: string;
  issuedAt: string;
  dueDate?: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  lines: { description: string; qty: number; unitPrice: number; kind: string }[];
  payments: { at: string; amount: number; method: string; reference?: string }[];
  vehicle?: { registrationNumber: string; make: string; model: string } | null;
  serviceOrder?: { code: string } | null;
};

export default function PortalInvoicesPage() {
  const list = useCollection<Row>('/api/portal/invoices', { limit: 15 });
  const [active, setActive] = useState<Row | null>(null);

  const totals = list.items.reduce(
    (acc, i) => ({
      billed: acc.billed + i.total,
      paid: acc.paid + i.amountPaid,
      due: acc.due + i.balance,
    }),
    { billed: 0, paid: 0, due: 0 },
  );

  const columns: Column<Row>[] = [
    {
      key: 'number',
      header: 'Invoice',
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-bold text-brand">{r.number}</p>
          <p className="text-[11px] text-subtle">{formatDate(r.issuedAt)}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      hideBelow: 'sm',
      render: (r) => (
        <div className="min-w-0">
          <p className="font-mono text-xs text-ink">{r.vehicle?.registrationNumber ?? '—'}</p>
          <p className="truncate text-[11px] text-muted">
            {r.vehicle?.make} {r.vehicle?.model}
          </p>
        </div>
      ),
    },
    {
      key: 'job',
      header: 'Job card',
      hideBelow: 'md',
      render: (r) => (
        <span className="font-mono text-xs text-muted">{r.serviceOrder?.code ?? '—'}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (r) => (
        <p className="text-right text-sm font-bold text-ink">{formatCurrency(r.total)}</p>
      ),
    },
    {
      key: 'balance',
      header: 'Due',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (r) => (
        <p
          className={`text-right text-sm font-semibold ${r.balance > 0 ? 'text-warning' : 'text-success'}`}
        >
          {formatCurrency(r.balance)}
        </p>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Invoices</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every bill, what you paid and anything still outstanding.
        </p>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Billed"
          value={formatCurrency(totals.billed)}
          icon={<FileText className="size-5" />}
        />
        <StatCard
          label="Paid"
          value={formatCurrency(totals.paid)}
          icon={<FileText className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(totals.due)}
          icon={<FileText className="size-5" />}
          tone={totals.due ? 'warning' : 'info'}
        />
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          onRowClick={setActive}
          emptyTitle="No invoices yet"
          emptyMessage="Invoices appear here once a service is completed."
        />
        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          onPage={(p) => list.setParam('page', p)}
        />
      </Card>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `Invoice ${active.number}` : ''}
        description={active ? `Issued ${formatDate(active.issuedAt)}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setActive(null)}>
              Close
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </>
        }
      >
        {active ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-bold text-ink">
                  {active.vehicle?.registrationNumber}
                </p>
                <p className="text-xs text-muted">
                  {active.vehicle?.make} {active.vehicle?.model}
                  {active.serviceOrder ? ` · Job ${active.serviceOrder.code}` : ''}
                </p>
              </div>
              <StatusBadge status={active.status} />
            </div>

            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/50">
                    <th className="px-4 py-2.5 text-left text-[11px] font-bold tracking-wider text-subtle uppercase">
                      Description
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-bold tracking-wider text-subtle uppercase">
                      Qty
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-bold tracking-wider text-subtle uppercase">
                      Rate
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-bold tracking-wider text-subtle uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {active.lines.map((l, i) => (
                    <tr key={`${l.description}-${i}`} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-2.5 text-ink">
                        {l.description}
                        <span className="ml-2 text-[10px] text-subtle">{titleCase(l.kind)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-ink">{l.qty}</td>
                      <td className="px-3 py-2.5 text-right text-muted">
                        {formatCurrency(l.unitPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink">
                        {formatCurrency(l.unitPrice * l.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-ink">{formatCurrency(active.subtotal)}</dd>
              </div>
              {active.discount ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-danger">− {formatCurrency(active.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted">GST ({active.taxRate}%)</dt>
                <dd className="text-ink">{formatCurrency(active.taxAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-bold text-ink">{formatCurrency(active.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Paid</dt>
                <dd className="text-success">{formatCurrency(active.amountPaid)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-semibold text-ink">Balance</dt>
                <dd
                  className={`font-bold ${active.balance > 0 ? 'text-warning' : 'text-success'}`}
                >
                  {formatCurrency(active.balance)}
                </dd>
              </div>
            </dl>

            {active.payments.length ? (
              <div>
                <p className="text-xs font-bold tracking-wide text-subtle uppercase">Payments</p>
                <ul className="mt-2 space-y-1.5">
                  {active.payments.map((p, i) => (
                    <li key={`${p.at}-${i}`} className="flex justify-between text-sm">
                      <span className="text-muted">
                        {titleCase(p.method)} · {formatDate(p.at)}
                        {p.reference ? ` · ${p.reference}` : ''}
                      </span>
                      <span className="font-semibold text-success">
                        {formatCurrency(p.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
