'use client';

import { RefreshCw, Search, X } from 'lucide-react';
import { cn, titleCase } from '@/lib/utils';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative min-w-0 flex-1 sm:max-w-xs', className)}>
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-line bg-surface-2/60 pr-8 pl-9 text-sm text-ink placeholder:text-subtle focus:border-brand focus:bg-surface focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-subtle transition hover:text-ink"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
  allLabel = 'All',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
  label?: string;
  allLabel?: string;
  className?: string;
}) {
  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: titleCase(o) } : o,
  );

  return (
    <label className={cn('flex items-center gap-2', className)}>
      {label ? (
        <span className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
          {label}
        </span>
      ) : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer rounded-xl border border-line bg-surface-2/60 px-3 text-sm text-ink focus:border-brand focus:bg-surface focus:outline-none"
      >
        <option value="ALL">{allLabel}</option>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-brand hover:text-brand"
      aria-label="Refresh"
    >
      <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
    </button>
  );
}
