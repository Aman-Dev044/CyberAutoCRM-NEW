'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarPlus,
  CarFront,
  CheckCircle2,
  Clock,
  FileText,
  Radar,
  Star,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/Stat';
import { EmptyState } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Field, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiGet, apiPost, type ApiClientError } from '@/lib/client';
import { ORDER_BOARD } from '@/lib/constants';
import { cn, formatCurrency, formatDate, titleCase } from '@/lib/utils';

type Vehicle = {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  insuranceExpiry?: string;
  pucExpiry?: string;
  nextServiceDue?: string;
};

type Order = {
  _id: string;
  code: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  promisedAt?: string;
  diagnosis?: string;
  customerRating?: number;
  vehicle?: { registrationNumber: string; make: string; model: string } | null;
};

type Appointment = {
  _id: string;
  code: string;
  status: string;
  scheduledAt: string;
  slot: string;
  estimatedCost: number;
  vehicle?: { registrationNumber: string } | null;
  services?: { name: string }[];
};

type Invoice = {
  _id: string;
  number: string;
  status: string;
  total: number;
  balance: number;
  issuedAt: string;
};

type Summary = {
  customer: { name: string; code: string } | null;
  vehicles: Vehicle[];
  appointments: Appointment[];
  orders: Order[];
  invoices: Invoice[];
  activeOrder: Order | null;
  nextAppointment: Appointment | null;
  totals: { vehicles: number; visits: number; spend: number; due: number };
};

export default function PortalHome() {
  const toast = useToast();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateTarget, setRateTarget] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet<Summary>('/api/portal/summary')
      .then(setData)
      .catch((err) => toast.error('Could not load your garage', (err as ApiClientError).message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const submitRating = async () => {
    if (!rateTarget) return;
    setSaving(true);
    try {
      await apiPost(`/api/portal/orders/${rateTarget._id}/feedback`, { rating, feedback });
      toast.success('Thanks for the feedback');
      setRateTarget(null);
      setFeedback('');
      load();
    } catch (err) {
      toast.error('Could not save your rating', (err as ApiClientError).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-28 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <EmptyState title="Nothing to show yet" message="Try refreshing the page." />
      </Card>
    );
  }

  const active = data.activeOrder;
  const stageIndex = active ? ORDER_BOARD.indexOf(active.status as (typeof ORDER_BOARD)[number]) : -1;

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Hello, {data.customer?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {active
            ? `Your ${active.vehicle?.make} is with us — currently ${titleCase(active.status).toLowerCase()}.`
            : data.nextAppointment
              ? `Next visit ${formatDate(data.nextAppointment.scheduledAt)} at ${data.nextAppointment.slot}.`
              : 'Nothing booked right now. Your car might be due a check.'}
        </p>
      </div>

      {/* Live job tracker */}
      {active ? (
        <Card className="mb-4 overflow-hidden">
          <CardHeader
            title={`Job card ${active.code}`}
            subtitle={`${active.vehicle?.registrationNumber} · ${active.vehicle?.make} ${active.vehicle?.model}`}
            icon={<Radar className="size-4.5" />}
            action={<StatusBadge status={active.status} />}
          />
          <CardBody>
            <ol className="flex flex-wrap gap-y-4">
              {ORDER_BOARD.filter((s) => s !== 'DELIVERED').map((stage, i) => {
                const done = stageIndex > i;
                const current = stageIndex === i;
                return (
                  <li key={stage} className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                        done
                          ? 'bg-success text-white'
                          : current
                            ? 'bg-brand text-brand-contrast ring-4 ring-brand/20'
                            : 'bg-surface-2 text-subtle',
                      )}
                    >
                      {done ? <CheckCircle2 className="size-4" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        'min-w-0 truncate text-[11px] font-semibold',
                        current ? 'text-ink' : 'text-subtle',
                      )}
                    >
                      {titleCase(stage)}
                    </span>
                    {i < ORDER_BOARD.length - 2 ? (
                      <span
                        className={cn('hidden h-px flex-1 sm:block', done ? 'bg-success' : 'bg-line')}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>

            {active.diagnosis ? (
              <p className="mt-6 rounded-xl bg-surface-2/60 p-4 text-sm leading-relaxed text-muted">
                <span className="font-semibold text-ink">What we found: </span>
                {active.diagnosis}
              </p>
            ) : null}

            <dl className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-subtle">Opened</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  {formatDate(active.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Promised by</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  {active.promisedAt ? formatDate(active.promisedAt) : 'To be confirmed'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Running total</dt>
                <dd className="mt-0.5 text-sm font-semibold text-brand">
                  {formatCurrency(active.grandTotal)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vehicles"
          value={data.totals.vehicles}
          icon={<CarFront className="size-5" />}
        />
        <StatCard
          label="Visits"
          value={data.totals.visits}
          icon={<Wrench className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Lifetime spend"
          value={formatCurrency(data.totals.spend)}
          icon={<Wallet className="size-5" />}
          tone="accent"
        />
        <StatCard
          label="Amount due"
          value={formatCurrency(data.totals.due)}
          icon={<FileText className="size-5" />}
          tone={data.totals.due ? 'warning' : 'info'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Upcoming */}
        <Card>
          <CardHeader
            title="Appointments"
            subtitle="Upcoming and recent"
            icon={<CalendarPlus className="size-4.5" />}
            action={
              <Link href="/portal/book" className="text-xs font-semibold text-brand hover:underline">
                Book one
              </Link>
            }
          />
          {data.appointments.length ? (
            <ul className="divide-y divide-line">
              {data.appointments.slice(0, 5).map((a) => (
                <li key={a._id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {formatDate(a.scheduledAt)}
                      <span className="text-xs font-normal text-muted">{a.slot}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {a.vehicle?.registrationNumber} ·{' '}
                      {a.services?.map((s) => s.name).join(', ') || 'Service'}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={a.status} />
                    <p className="mt-1 text-xs text-muted">{formatCurrency(a.estimatedCost)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<CalendarPlus className="size-6" />}
              title="No appointments yet"
              action={
                <Link
                  href="/portal/book"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast"
                >
                  Book a service
                  <ArrowRight className="size-4" />
                </Link>
              }
            />
          )}
        </Card>

        {/* Service history */}
        <Card>
          <CardHeader
            title="Service history"
            subtitle="Everything we have done for you"
            icon={<Wrench className="size-4.5" />}
          />
          {data.orders.length ? (
            <ul className="divide-y divide-line">
              {data.orders.slice(0, 5).map((o) => (
                <li key={o._id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-bold text-brand">{o.code}</p>
                    <p className="truncate text-xs text-muted">
                      {o.vehicle?.registrationNumber} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={o.status} />
                    <p className="mt-1 text-xs font-semibold text-ink">
                      {formatCurrency(o.grandTotal)}
                    </p>
                  </div>
                  {['READY', 'DELIVERED'].includes(o.status) && !o.customerRating ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRateTarget(o);
                        setRating(5);
                      }}
                      className="shrink-0 rounded-lg bg-warning-soft px-2 py-1 text-[10px] font-bold text-warning"
                    >
                      Rate
                    </button>
                  ) : o.customerRating ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                      <Star className="size-3 fill-warning text-warning" />
                      {o.customerRating}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No service history yet" message="Your first visit will appear here." />
          )}
        </Card>
      </div>

      {/* Vehicles + reminders */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="My vehicles"
            icon={<CarFront className="size-4.5" />}
            action={
              <Link
                href="/portal/vehicles"
                className="text-xs font-semibold text-brand hover:underline"
              >
                Manage
              </Link>
            }
          />
          {data.vehicles.length ? (
            <ul className="divide-y divide-line">
              {data.vehicles.map((v) => {
                const insuranceSoon =
                  v.insuranceExpiry &&
                  (new Date(v.insuranceExpiry).getTime() - Date.now()) / 86400000 < 30;
                return (
                  <li key={v._id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold text-ink">
                        {v.registrationNumber}
                      </p>
                      <p className="text-xs text-muted">
                        {v.make} {v.model} · {v.year}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      {insuranceSoon ? (
                        <span className="rounded-md bg-danger-soft px-2 py-0.5 font-semibold text-danger">
                          Insurance due {formatDate(v.insuranceExpiry)}
                        </span>
                      ) : v.nextServiceDue ? (
                        <span className="flex items-center gap-1 text-muted">
                          <Clock className="size-3" />
                          Service due {formatDate(v.nextServiceDue)}
                        </span>
                      ) : (
                        <span className="text-subtle">All good</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="No vehicles on file"
              message="Add your car so booking takes one tap."
              action={
                <Link
                  href="/portal/vehicles"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast"
                >
                  Add a vehicle
                </Link>
              }
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Invoices"
            icon={<FileText className="size-4.5" />}
            action={
              <Link
                href="/portal/invoices"
                className="text-xs font-semibold text-brand hover:underline"
              >
                View all
              </Link>
            }
          />
          {data.invoices.length ? (
            <ul className="divide-y divide-line">
              {data.invoices.slice(0, 5).map((inv) => (
                <li key={inv._id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-bold text-brand">{inv.number}</p>
                    <p className="text-xs text-muted">{formatDate(inv.issuedAt)}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                  <div className="w-24 text-right">
                    <p className="text-sm font-semibold text-ink">{formatCurrency(inv.total)}</p>
                    {inv.balance > 0 ? (
                      <p className="text-[11px] text-warning">
                        {formatCurrency(inv.balance)} due
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No invoices yet" />
          )}
        </Card>
      </div>

      <Modal
        open={!!rateTarget}
        onClose={() => setRateTarget(null)}
        title="How did we do?"
        description={rateTarget ? `Job card ${rateTarget.code}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRateTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={submitRating}>
              Submit rating
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
              >
                <Star
                  className={cn(
                    'size-9 transition',
                    n <= rating ? 'fill-warning text-warning' : 'text-line-strong',
                  )}
                />
              </button>
            ))}
          </div>
          <Field label="Anything you want to tell us?">
            <Textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="The pickup was on time and the estimate matched the invoice."
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
