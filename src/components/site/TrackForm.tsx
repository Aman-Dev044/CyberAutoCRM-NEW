'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CarFront, Clock, Radar, Search, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/DataTable';
import { apiGet, type ApiClientError } from '@/lib/client';
import { formatCurrency, formatDate } from '@/lib/utils';

type TrackResult = {
  kind: 'APPOINTMENT' | 'JOB';
  code: string;
  status: string;
  priority?: string;
  scheduledAt?: string;
  slot?: string;
  vehicle?: { registrationNumber: string; make: string; model: string };
  customerName?: string;
  services?: string[];
  items?: string[];
  estimatedCost?: number;
  grandTotal?: number;
  promisedAt?: string;
  deliveredAt?: string;
  jobCard?: { code: string; status: string } | null;
  timeline: { at: string; status?: string; note?: string }[];
};

export function TrackForm() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [data, setData] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (value: string) => {
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 6) {
      setError('Enter the full reference code, e.g. APT-7X4K9B');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await apiGet<TrackResult>(`/api/public/track?code=${encodeURIComponent(trimmed)}`));
    } catch (err) {
      setData(null);
      setError((err as ApiClientError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep link from the booking confirmation screen.
  useEffect(() => {
    const initial = params.get('code');
    if (initial) lookup(initial);
  }, [params, lookup]);

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="APT-7X4K9B or JOB-3M8PQD"
          className="h-12 font-mono tracking-wider sm:flex-1"
          aria-label="Booking or job card reference"
        />
        <Button type="submit" size="lg" loading={loading} className="sm:w-auto">
          <Search className="size-4" />
          Track
        </Button>
      </form>

      {error ? (
        <div className="rounded-2xl border border-danger/35 bg-danger-soft px-5 py-4 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}

      {!data && !error && !loading ? (
        <div className="rounded-2xl border border-line bg-surface">
          <EmptyState
            icon={<Radar className="size-6" />}
            title="Enter your reference code"
            message="You will find it on your booking confirmation, SMS or printed job card."
          />
        </div>
      ) : null}

      {data ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-subtle uppercase">
                  {data.kind === 'JOB' ? 'Job card' : 'Booking'}
                </p>
                <h2 className="mt-1 font-mono text-2xl font-bold tracking-wider text-ink">
                  {data.code}
                </h2>
                {data.customerName ? (
                  <p className="mt-1 text-sm text-muted">{data.customerName}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={data.status} />
                {data.priority ? <StatusBadge status={data.priority} /> : null}
              </div>
            </div>

            <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.vehicle ? (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-subtle">
                    <CarFront className="size-3.5" /> Vehicle
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">
                    {data.vehicle.registrationNumber}
                    <span className="block text-xs font-normal text-muted">
                      {data.vehicle.make} {data.vehicle.model}
                    </span>
                  </dd>
                </div>
              ) : null}

              {data.scheduledAt ? (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-subtle">
                    <Clock className="size-3.5" /> Scheduled
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">
                    {formatDate(data.scheduledAt)}
                    <span className="block text-xs font-normal text-muted">{data.slot}</span>
                  </dd>
                </div>
              ) : null}

              {data.promisedAt ? (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-subtle">
                    <Clock className="size-3.5" /> Promised
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">
                    {formatDate(data.promisedAt, true)}
                  </dd>
                </div>
              ) : null}

              <div>
                <dt className="flex items-center gap-1.5 text-xs text-subtle">
                  <Wrench className="size-3.5" /> {data.kind === 'JOB' ? 'Total' : 'Estimate'}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-brand">
                  {formatCurrency(data.grandTotal ?? data.estimatedCost ?? 0)}
                </dd>
              </div>
            </dl>

            {(data.services ?? data.items)?.length ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                {(data.services ?? data.items ?? []).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}

            {data.jobCard ? (
              <p className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-xs text-brand">
                Work has started under job card{' '}
                <span className="font-mono font-bold">{data.jobCard.code}</span> — track that code
                for live bay updates.
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <h3 className="text-sm font-semibold text-ink">Progress timeline</h3>
            <ol className="mt-5 space-y-5">
              {[...data.timeline].reverse().map((t, i) => (
                <li key={`${t.at}-${i}`} className="relative flex gap-4 pl-1">
                  <span className="relative flex flex-col items-center">
                    <span
                      className={`size-2.5 rounded-full ${i === 0 ? 'bg-brand ring-4 ring-brand/20' : 'bg-line-strong'}`}
                    />
                    {i < data.timeline.length - 1 ? (
                      <span className="mt-1 w-px flex-1 bg-line" />
                    ) : null}
                  </span>
                  <div className="-mt-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.status ? <StatusBadge status={t.status} /> : null}
                      <span className="text-xs text-subtle">{formatDate(t.at, true)}</span>
                    </div>
                    {t.note ? <p className="mt-1.5 text-sm text-muted">{t.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
