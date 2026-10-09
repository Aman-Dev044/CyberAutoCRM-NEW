'use client';

import { ScrollText, ShieldCheck } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton } from '@/components/admin/Filters';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { useCollection } from '@/hooks/useCollection';
import { formatDate, relativeTime, titleCase } from '@/lib/utils';

type Row = {
  _id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  summary?: string;
  ip?: string;
  createdAt: string;
};

const ACTION_TONE: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'brand' | 'neutral'> =
  {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'danger',
    LOGIN: 'brand',
    LOGOUT: 'neutral',
    REGISTER: 'brand',
    STATUS_CHANGE: 'warning',
    PAYMENT: 'success',
    CONVERT: 'warning',
    PASSWORD_RESET: 'danger',
    PASSWORD_CHANGE: 'warning',
    PUBLIC_BOOKING: 'brand',
    SEED: 'neutral',
  };

export default function AuditLogsPage() {
  const list = useCollection<Row>('/api/audit-logs', { limit: 30 });

  const facets = (list.data?.facets as { actions: string[]; entities: string[] }) ?? {
    actions: [],
    entities: [],
  };

  const columns: Column<Row>[] = [
    {
      key: 'when',
      header: 'When',
      render: (r) => (
        <div>
          <p className="text-xs font-medium text-ink">{relativeTime(r.createdAt)}</p>
          <p className="text-[11px] text-subtle">{formatDate(r.createdAt, true)}</p>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Who',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{r.actorName}</p>
          <StatusBadge status={r.actorRole} />
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <Badge tone={ACTION_TONE[r.action] ?? 'neutral'} dot>
          {titleCase(r.action)}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      hideBelow: 'md',
      render: (r) => (
        <div>
          <p className="text-sm text-ink">{r.entity}</p>
          {r.entityId ? (
            <p className="font-mono text-[10px] text-subtle">{r.entityId.slice(-8)}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'Detail',
      render: (r) => <span className="text-sm text-muted">{r.summary ?? '—'}</span>,
    },
    {
      key: 'ip',
      header: 'IP',
      hideBelow: 'lg',
      render: (r) => <span className="font-mono text-[11px] text-subtle">{r.ip ?? '—'}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Who changed what, when, and from where. Written automatically on every mutation."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]}
        action={
          <span className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-xs text-muted">
            <ShieldCheck className="size-4 text-success" />
            Append-only
          </span>
        }
      />

      <Card>
        <Toolbar>
          <FilterSelect
            label="Action"
            value={String(list.params.action ?? 'ALL')}
            onChange={(v) => list.setParam('action', v)}
            options={facets.actions}
          />
          <FilterSelect
            label="Entity"
            value={String(list.params.entity ?? 'ALL')}
            onChange={(v) => list.setParam('entity', v)}
            options={facets.entities}
          />
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          emptyTitle="No audit entries"
          emptyMessage="Activity shows up here as soon as someone changes a record."
          rowKey={(r) => r._id}
        />

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          onPage={(p) => list.setParam('page', p)}
        />
      </Card>

      <p className="mt-4 flex items-center gap-2 text-xs text-subtle">
        <ScrollText className="size-3.5" />
        Entries cannot be edited or deleted from the UI — that is the point of an audit trail.
      </p>
    </>
  );
}
