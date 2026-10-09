'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CarFront,
  ChevronRight,
  Clock,
  GripVertical,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton } from '@/components/admin/Filters';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { apiGet, apiPatch, qs, type ApiClientError } from '@/lib/client';
import { ORDER_BOARD, ORDER_PRIORITY, type OrderStatus } from '@/lib/constants';
import { cn, formatCurrency, relativeTime, titleCase } from '@/lib/utils';

type BoardOrder = {
  _id: string;
  code: string;
  status: OrderStatus;
  priority: string;
  grandTotal: number;
  promisedAt?: string;
  createdAt: string;
  customer?: { name: string } | null;
  vehicle?: { registrationNumber: string; make: string; model: string } | null;
  technicians?: { _id: string; name: string }[];
};

const COLUMN_TONE: Record<string, string> = {
  OPEN: 'border-t-line-strong',
  DIAGNOSING: 'border-t-info',
  AWAITING_PARTS: 'border-t-warning',
  IN_PROGRESS: 'border-t-brand',
  QUALITY_CHECK: 'border-t-accent',
  READY: 'border-t-success',
  DELIVERED: 'border-t-success',
};

export default function BoardPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState('ALL');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiGet<{ items: BoardOrder[] }>(`/api/orders${qs({ board: true, priority })}`)
      .then((r) => setOrders(r.items))
      .catch((err) => toast.error('Could not load the board', (err as ApiClientError).message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [priority]);

  const columns = useMemo(
    () =>
      ORDER_BOARD.map((status) => ({
        status,
        orders: orders.filter((o) => o.status === status),
      })),
    [orders],
  );

  const move = async (order: BoardOrder, status: OrderStatus) => {
    if (order.status === status) return;
    setBusyId(order._id);
    // Optimistic: the column redraws immediately, reverting on failure.
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status } : o)));
    try {
      await apiPatch(`/api/orders/${order._id}`, { status });
      toast.success(`${order.code} → ${titleCase(status)}`);
    } catch (err) {
      setOrders(previous);
      toast.error('Could not move the job card', (err as ApiClientError).message);
    } finally {
      setBusyId(null);
    }
  };

  const nextStatus = (status: OrderStatus): OrderStatus | null => {
    const i = ORDER_BOARD.indexOf(status);
    return i >= 0 && i < ORDER_BOARD.length - 1 ? ORDER_BOARD[i + 1] : null;
  };

  const totalValue = orders
    .filter((o) => o.status !== 'DELIVERED')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <>
      <PageHeader
        title="Workshop board"
        description={`${orders.filter((o) => o.status !== 'DELIVERED').length} job cards on the floor · ${formatCurrency(totalValue)} work in progress`}
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Workshop Board' }]}
        action={
          <>
            <FilterSelect
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={ORDER_PRIORITY}
            />
            <RefreshButton onClick={load} loading={loading} />
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-4">
            {columns.map((col) => (
              <section
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverColumn(col.status);
                }}
                onDragLeave={() => setOverColumn((c) => (c === col.status ? null : c))}
                onDrop={() => {
                  const order = orders.find((o) => o._id === dragId);
                  setOverColumn(null);
                  setDragId(null);
                  if (order) move(order, col.status);
                }}
                className={cn(
                  'flex w-76 shrink-0 flex-col rounded-2xl border border-t-2 border-line bg-surface transition-colors',
                  COLUMN_TONE[col.status],
                  overColumn === col.status && 'bg-brand-soft/40 ring-2 ring-brand/30',
                )}
              >
                <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                  <h2 className="text-xs font-bold tracking-wide text-ink uppercase">
                    {titleCase(col.status)}
                  </h2>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">
                    {col.orders.length}
                  </span>
                </header>

                <div className="flex-1 space-y-2.5 p-3">
                  {col.orders.map((o) => {
                    const overdue =
                      o.promisedAt &&
                      new Date(o.promisedAt).getTime() < Date.now() &&
                      !['READY', 'DELIVERED'].includes(o.status);
                    const next = nextStatus(o.status);

                    return (
                      <article
                        key={o._id}
                        draggable
                        onDragStart={() => setDragId(o._id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn(
                          'group rounded-xl border border-line bg-surface-2/50 p-3 transition-all hover:border-brand/40 hover:shadow-card',
                          dragId === o._id && 'opacity-50',
                          busyId === o._id && 'pointer-events-none opacity-60',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/admin/orders/${o._id}`}
                            className="font-mono text-xs font-bold text-brand hover:underline"
                          >
                            {o.code}
                          </Link>
                          <GripVertical className="size-3.5 shrink-0 cursor-grab text-subtle opacity-0 transition group-hover:opacity-100" />
                        </div>

                        <p className="mt-2 flex items-center gap-1.5 font-mono text-xs font-semibold text-ink">
                          <CarFront className="size-3.5 text-muted" />
                          {o.vehicle?.registrationNumber ?? '—'}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {o.vehicle?.make} {o.vehicle?.model} · {o.customer?.name}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={o.priority} />
                          {overdue ? (
                            <Badge tone="danger" dot>
                              Overdue
                            </Badge>
                          ) : null}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                          <span className="flex min-w-0 items-center gap-1 text-[11px] text-subtle">
                            <User className="size-3" />
                            <span className="truncate">
                              {o.technicians?.length
                                ? o.technicians.map((t) => t.name.split(' ')[0]).join(', ')
                                : 'Unassigned'}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-ink">
                            {formatCurrency(o.grandTotal)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[10px] text-subtle">
                            <Clock className="size-3" />
                            {relativeTime(o.createdAt)}
                          </span>
                          {next ? (
                            <button
                              type="button"
                              onClick={() => move(o, next)}
                              className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-[10px] font-bold text-brand transition hover:bg-brand hover:text-brand-contrast"
                            >
                              {titleCase(next)}
                              <ChevronRight className="size-3" />
                            </button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}

                  {!col.orders.length ? (
                    <p className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-[11px] text-subtle">
                      Drop a job card here
                    </p>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {!loading && !orders.length ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface">
          <EmptyState
            icon={<AlertTriangle className="size-6" />}
            title="No job cards yet"
            message="Convert a confirmed appointment into a job card to see it on the board."
            action={
              <Link
                href="/admin/appointments"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast"
              >
                Go to appointments
                <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>
      ) : null}
    </>
  );
}
