'use client';

import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Hide on small screens to keep tables readable on phones. */
  hideBelow?: 'sm' | 'md' | 'lg';
};

const HIDE = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

export function DataTable<T extends { _id?: string; id?: string }>({
  columns,
  rows,
  loading = false,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  onRowClick,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-4 py-3 text-left text-[11px] font-bold tracking-wider text-subtle uppercase',
                  c.hideBelow && HIDE[c.hideBelow],
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey?.(row) ?? row._id ?? row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-line/70 transition-colors last:border-0',
                onRowClick && 'cursor-pointer hover:bg-surface-2/70',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-4 py-3 align-middle text-ink',
                    c.hideBelow && HIDE[c.hideBelow],
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-subtle">
        {icon ?? <Inbox className="size-6" />}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {message ? <p className="mx-auto mt-1 max-w-sm text-xs text-muted">{message}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) {
    return (
      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
        <span>{total} records</span>
      </div>
    );
  }

  const windowed = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1,
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <span className="text-xs text-muted">
        Page {page} of {pages} · {total} records
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:text-ink disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {windowed.map((p, idx) => (
          <span key={p} className="flex items-center">
            {idx > 0 && p - windowed[idx - 1] > 1 ? (
              <span className="px-1 text-xs text-subtle">…</span>
            ) : null}
            <button
              type="button"
              onClick={() => onPage(p)}
              className={cn(
                'size-8 rounded-lg border text-xs font-semibold transition',
                p === page
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-line text-muted hover:text-ink',
              )}
            >
              {p}
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:text-ink disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
