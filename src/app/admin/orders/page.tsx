'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { useCollection } from '@/hooks/useCollection';
import { ORDER_PRIORITY, ORDER_STATUS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

type Row = {
  _id: string;
  code: string;
  status: string;
  priority: string;
  grandTotal: number;
  laborTotal: number;
  partsTotal: number;
  createdAt: string;
  promisedAt?: string;
  customer?: { name: string; phone: string } | null;
  vehicle?: { registrationNumber: string; make: string; model: string } | null;
  technicians?: { _id: string; name: string }[];
};

export default function OrdersPage() {
  const router = useRouter();
  const params = useSearchParams();

  const list = useCollection<Row>('/api/orders', {
    q: params.get('q') ?? '',
    status: params.get('status') ?? 'ALL',
    priority: 'ALL',
  });

  const columns: Column<Row>[] = [
    {
      key: 'code',
      header: 'Job card',
      render: (r) => (
        <div>
          <p className="font-mono text-xs font-bold text-brand">{r.code}</p>
          <p className="mt-0.5 text-[11px] text-subtle">{formatDate(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
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
      key: 'customer',
      header: 'Customer',
      hideBelow: 'md',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{r.customer?.name ?? '—'}</p>
          <p className="text-[11px] text-muted">{r.customer?.phone}</p>
        </div>
      ),
    },
    {
      key: 'tech',
      header: 'Technicians',
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-xs text-muted">
          {r.technicians?.length ? r.technicians.map((t) => t.name).join(', ') : 'Unassigned'}
        </span>
      ),
    },
    { key: 'priority', header: 'Priority', hideBelow: 'md', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (r) => (
        <div className="text-right">
          <p className="text-sm font-bold text-ink">{formatCurrency(r.grandTotal)}</p>
          <p className="text-[11px] text-subtle">
            {formatCurrency(r.laborTotal)} labour · {formatCurrency(r.partsTotal)} parts
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Job cards"
        description="Every repair order, from first inspection to delivery."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Job Cards' }]}
        action={
          <ButtonLink href="/admin/orders/new">
            <Plus className="size-4" />
            New job card
          </ButtonLink>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Search by job code…"
          />
          <FilterSelect
            label="Status"
            value={String(list.params.status ?? 'ALL')}
            onChange={(v) => list.setParam('status', v)}
            options={ORDER_STATUS}
          />
          <FilterSelect
            label="Priority"
            value={String(list.params.priority ?? 'ALL')}
            onChange={(v) => list.setParam('priority', v)}
            options={ORDER_PRIORITY}
          />
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          onRowClick={(r) => router.push(`/admin/orders/${r._id}`)}
          emptyTitle="No job cards found"
          emptyMessage="Convert an appointment or create one directly."
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
