'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { apiGet, qs } from '@/lib/client';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Field';

type Option = { id: string; label: string; sub?: string };

/**
 * Searchable single-select backed by a list endpoint. Keeps the chosen
 * label visible after selection so forms stay readable.
 */
export function EntityPicker({
  endpoint,
  value,
  onChange,
  toOption,
  label,
  placeholder = 'Search…',
  required,
  error,
  extraParams,
  disabled,
  emptyHint = 'No matches',
}: {
  endpoint: string;
  value: string;
  onChange: (id: string, option?: Option) => void;
  toOption: (row: Record<string, unknown>) => Option;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  extraParams?: Record<string, string | number | undefined>;
  disabled?: boolean;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [rows, setRows] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Option | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const params = useMemo(
    () => qs({ q: debounced, limit: 12, ...(extraParams ?? {}) }),
    [debounced, extraParams],
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    apiGet<{ items: Record<string, unknown>[] }>(`${endpoint}${params}`)
      .then((res) => active && setRows(res.items.map(toOption)))
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // toOption is a render-stable formatter; excluding it avoids a refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, params, open]);

  // Resolve the label for a pre-set value (edit mode).
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    let active = true;
    apiGet<Record<string, unknown>>(`${endpoint}/${value}`)
      .then((row) => active && setSelected(toOption(row)))
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, endpoint]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="min-w-0" ref={boxRef}>
      {label ? <Label required={required}>{label}</Label> : null}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-11 w-full items-center gap-2 rounded-xl border bg-surface px-3.5 text-left text-sm transition-colors',
            error ? 'border-danger' : 'border-line hover:border-brand/50',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {selected ? (
              <>
                <span className="text-ink">{selected.label}</span>
                {selected.sub ? (
                  <span className="ml-2 text-xs text-muted">{selected.sub}</span>
                ) : null}
              </>
            ) : (
              <span className="text-subtle">{placeholder}</span>
            )}
          </span>
          {selected ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(null);
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  setSelected(null);
                  onChange('');
                }
              }}
              className="shrink-0 rounded p-0.5 text-subtle hover:text-danger"
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </span>
          ) : null}
          <ChevronDown className="size-4 shrink-0 text-subtle" />
        </button>

        {open ? (
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
            <div className="relative border-b border-line">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-subtle" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="h-10 w-full bg-transparent pr-3 pl-9 text-sm text-ink placeholder:text-subtle focus:outline-none"
              />
            </div>

            <ul className="max-h-60 overflow-y-auto py-1">
              {loading ? (
                <li className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-muted">
                  <Loader2 className="size-3.5 animate-spin" />
                  Searching…
                </li>
              ) : rows.length ? (
                rows.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(r);
                        onChange(r.id, r);
                        setOpen(false);
                        setQuery('');
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{r.label}</span>
                        {r.sub ? (
                          <span className="block truncate text-xs text-muted">{r.sub}</span>
                        ) : null}
                      </span>
                      {value === r.id ? <Check className="size-4 shrink-0 text-brand" /> : null}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-6 text-center text-xs text-muted">{emptyHint}</li>
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}

/** Multi-select pill list for small, fully-loaded option sets. */
export function MultiPicker({
  options,
  value,
  onChange,
  label,
  required,
  error,
  columns = 2,
}: {
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
  columns?: 1 | 2 | 3;
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const cols = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };

  return (
    <div>
      {label ? <Label required={required}>{label}</Label> : null}
      <div
        className={cn(
          'grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-line bg-surface-2/40 p-2',
          cols[columns],
          error && 'border-danger',
        )}
      >
        {options.map((o) => {
          const active = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition',
                active
                  ? 'border-brand bg-brand-soft'
                  : 'border-transparent bg-surface hover:border-line-strong',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 grid size-4 shrink-0 place-items-center rounded border',
                  active ? 'border-brand bg-brand text-brand-contrast' : 'border-line-strong',
                )}
              >
                {active ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-ink">{o.label}</span>
                {o.sub ? <span className="block text-[11px] text-muted">{o.sub}</span> : null}
              </span>
            </button>
          );
        })}
        {!options.length ? (
          <p className="px-3 py-4 text-xs text-muted">Nothing available to pick.</p>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
