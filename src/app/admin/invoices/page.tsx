'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { IndianRupee, Receipt, Wallet } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/Stat';
import { StatusBadge } from '@/components/ui/Badge';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { useCollection } from '@/hooks/useCollection';
import { INVOICE_STATUS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

type Row = {
  _id: string;
  number: string;
  status: string;
  issuedAt: string;
  dueDate?: string;
  total: number;
  amountPaid: number;
  balance: number;
  customer?: { name: string; phone: string } | null;
  vehicle?: { registrationNumber: string } | null;
  serviceOrder?: { code: string } | null;
};

export default function InvoicesPage() {
  const router = useRouter();
  const params = useSearchParams();

  const list = useCollection<Row>('/api/invoices', {
    q: params.get('q') ?? '',
    status: params.get('status') ?? 'ALL',
  });

  const summary = (list.data?.summary as
    | { billed: number; collected: number; outstanding: number }
    | undefined) ?? { billed: 0, collected: 0, outstanding: 0 };

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
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{r.customer?.name ?? '—'}</p>
          <p className="font-mono text-[11px] text-muted">
            {r.vehicle?.registrationNumber ?? ''}
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
      key: 'due',
      header: 'Due',
      hideBelow: 'md',
      render: (r) => {
        const overdue =
          r.dueDate && new Date(r.dueDate).getTime() < Date.now() && r.balance > 0;
        return (
          <span className={`text-xs ${overdue ? 'font-semibold text-danger' : 'text-muted'}`}>
            {r.dueDate ? formatDate(r.dueDate) : '—'}
          </span>
        );
      },
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
      key: 'paid',
      header: 'Paid',
      className: 'text-right',
      headerClassName: 'text-right',
      hideBelow: 'md',
      render: (r) => (
        <p className="text-right text-sm text-success">{formatCurrency(r.amountPaid)}</p>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (r) => (
        <p
          className={`text-right text-sm font-semibold ${r.balance > 0 ? 'text-warning' : 'text-muted'}`}
        >
          {formatCurrency(r.balance)}
        </p>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Billing, payments and what is still outstanding."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Invoices' }]}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Billed (filtered)"
          value={formatCurrency(summary.billed)}
          icon={<Receipt className="size-5" />}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(summary.collected)}
          icon={<Wallet className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
          icon={<IndianRupee className="size-5" />}
          tone={summary.outstanding ? 'warning' : 'info'}
        />
      </div>

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Search invoice number…"
          />
          <FilterSelect
            label="Status"
            value={String(list.params.status ?? 'ALL')}
            onChange={(v) => list.setParam('status', v)}
            options={INVOICE_STATUS}
          />
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          onRowClick={(r) => router.push(`/admin/invoices/${r._id}`)}
          emptyTitle="No invoices found"
          emptyMessage="Raise one from a job card once the work is costed."
        />

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          onPage={(p) => list.setParam('page', p)}
        />
      </Card>
    </>
  );
}
