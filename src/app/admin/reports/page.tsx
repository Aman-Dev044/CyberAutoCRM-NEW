'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarRange,
  Download,
  Package,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton } from '@/components/admin/Filters';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/Stat';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { BarList, DailyBarChart, RevenueChart } from '@/components/admin/Charts';
import { apiGet, type ApiClientError } from '@/lib/client';
import { formatCurrency, formatNumber, titleCase } from '@/lib/utils';

type ReportData = {
  days: number;
  revenueByDay: { date: string; billed: number; collected: number }[];
  paymentMix: { method: string; amount: number }[];
  categoryMix: { category: string; bookings: number; services: number }[];
  funnel: Record<string, number>;
  inventory: { stockValue: number; retailValue: number; skus: number };
  csat: { avg: number; responses: number } | null;
  series: { month: string; billed: number; collected: number; jobs: number }[];
  technicians: {
    id: string;
    name: string;
    specialization: string;
    jobs: number;
    revenue: number;
    avgRating: number | null;
  }[];
  services: { name: string; jobs: number; revenue: number }[];
};

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
];

export default function ReportsPage() {
  const toast = useToast();
  const [days, setDays] = useState('30');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiGet<ReportData>(`/api/reports?days=${days}`)
      .then(setData)
      .catch((err) => toast.error('Could not load reports', (err as ApiClientError).message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [days]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Billed', 'Collected'],
      ...data.revenueByDay.map((r) => [r.date, String(r.billed), String(r.collected)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberautosuite-revenue-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const billed = data?.revenueByDay.reduce((s, r) => s + r.billed, 0) ?? 0;
  const collected = data?.revenueByDay.reduce((s, r) => s + r.collected, 0) ?? 0;
  const bookings = Object.values(data?.funnel ?? {}).reduce((s, n) => s + n, 0);
  const completed = (data?.funnel?.COMPLETED ?? 0) + (data?.funnel?.IN_PROGRESS ?? 0);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Revenue, service mix, technician output and inventory value."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]}
        action={
          <>
            <FilterSelect
              label="Range"
              value={days}
              onChange={setDays}
              options={RANGES}
              allLabel="Last 30 days"
            />
            <RefreshButton onClick={load} loading={loading} />
            <Button variant="secondary" onClick={exportCsv} disabled={!data}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </>
        }
      />

      {loading && !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={`Billed · last ${data.days}d`}
              value={formatCurrency(billed)}
              icon={<TrendingUp className="size-5" />}
            />
            <StatCard
              label="Collected"
              value={formatCurrency(collected)}
              icon={<Wallet className="size-5" />}
              tone="success"
              footer={billed ? `${Math.round((collected / billed) * 100)}% of billed` : undefined}
            />
            <StatCard
              label="Bookings taken"
              value={formatNumber(bookings)}
              icon={<CalendarRange className="size-5" />}
              tone="info"
              footer={`${completed} progressed to the floor`}
            />
            <StatCard
              label="Customer satisfaction"
              value={data.csat ? `${data.csat.avg} / 5` : '—'}
              icon={<Star className="size-5" />}
              tone="accent"
              footer={data.csat ? `${data.csat.responses} responses` : 'No ratings yet'}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Daily billing"
                subtitle={`Billed vs collected over the last ${data.days} days`}
                icon={<BarChart3 className="size-4.5" />}
              />
              <CardBody className="pr-2 pl-0">
                {data.revenueByDay.length ? (
                  <DailyBarChart data={data.revenueByDay} height={300} />
                ) : (
                  <EmptyState title="No invoices in this period" />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Payment mix" subtitle="How customers actually pay" />
              <CardBody>
                <BarList
                  money
                  items={data.paymentMix.map((p) => ({
                    label: titleCase(p.method),
                    value: p.amount,
                  }))}
                />
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Twelve-month trend"
                subtitle="Billed, collected and job volume"
                icon={<TrendingUp className="size-4.5" />}
              />
              <CardBody className="pr-2 pl-0">
                <RevenueChart data={data.series} height={300} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Booking funnel" subtitle={`Last ${data.days} days`} />
              <CardBody>
                <BarList
                  items={Object.entries(data.funnel)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => ({ label: titleCase(status), value: count }))}
                />
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Revenue by service" subtitle="All time, top performers" />
              <CardBody>
                <BarList
                  money
                  items={data.services.map((s) => ({
                    label: s.name,
                    value: s.revenue,
                    meta: `${s.jobs} jobs`,
                  }))}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Bookings by category" subtitle="Where demand sits" />
              <CardBody>
                <BarList
                  items={data.categoryMix.map((c) => ({
                    label: c.category,
                    value: c.bookings,
                    meta: `${c.services} service${c.services === 1 ? '' : 's'}`,
                  }))}
                />
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Technician output"
                subtitle="Delivered job cards and the revenue they carried"
              />
              {data.technicians.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface-2/50">
                        {['Technician', 'Focus', 'Jobs', 'Revenue', 'Avg / job', 'Rating'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-5 py-2.5 text-left text-[11px] font-bold tracking-wider text-subtle uppercase"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.technicians.map((t) => (
                        <tr key={t.id} className="border-b border-line/70 last:border-0">
                          <td className="px-5 py-3 font-medium text-ink">{t.name}</td>
                          <td className="px-5 py-3 text-xs text-muted">{t.specialization}</td>
                          <td className="px-5 py-3 font-semibold text-ink">{t.jobs}</td>
                          <td className="px-5 py-3 text-ink">{formatCurrency(t.revenue)}</td>
                          <td className="px-5 py-3 text-muted">
                            {formatCurrency(t.jobs ? t.revenue / t.jobs : 0)}
                          </td>
                          <td className="px-5 py-3">
                            {t.avgRating ? (
                              <span className="inline-flex items-center gap-1 text-ink">
                                <Star className="size-3.5 fill-warning text-warning" />
                                {t.avgRating}
                              </span>
                            ) : (
                              <span className="text-subtle">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No delivered jobs in the window" />
              )}
            </Card>

            <Card>
              <CardHeader title="Inventory value" icon={<Package className="size-4.5" />} />
              <CardBody>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs text-muted">Stock at cost</dt>
                    <dd className="font-display text-2xl font-bold text-ink">
                      {formatCurrency(data.inventory.stockValue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Stock at retail</dt>
                    <dd className="font-display text-2xl font-bold text-success">
                      {formatCurrency(data.inventory.retailValue)}
                    </dd>
                  </div>
                  <div className="border-t border-line pt-4">
                    <dt className="text-xs text-muted">Potential margin</dt>
                    <dd className="text-lg font-bold text-brand">
                      {formatCurrency(data.inventory.retailValue - data.inventory.stockValue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">SKUs tracked</dt>
                    <dd className="text-lg font-bold text-ink">{data.inventory.skus}</dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <EmptyState title="Reports unavailable" message="Try refreshing in a moment." />
        </Card>
      )}
    </>
  );
}
