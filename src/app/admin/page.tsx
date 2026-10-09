import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CarFront,
  Clock,
  IndianRupee,
  Inbox,
  Package,
  Star,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { formatCurrency, formatDate, relativeTime } from '@/lib/utils';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/Stat';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/admin/PageHeader';
import { BarList, RevenueChart, StatusDonut } from '@/components/admin/Charts';
import {
  getDashboardStats,
  getOrderStatusBreakdown,
  getRecentJobs,
  getRevenueSeries,
  getTechnicianPerformance,
  getTodaySchedule,
  getTopServices,
} from '@/server/analytics';

export const metadata = { title: 'Dashboard' };

export default async function AdminDashboard() {
  const session = await getSession();

  const [stats, series, statuses, topServices, technicians, recentJobs, schedule] =
    await Promise.all([
      getDashboardStats(),
      getRevenueSeries(6),
      getOrderStatusBreakdown(),
      getTopServices(6),
      getTechnicianPerformance(5),
      getRecentJobs(6),
      getTodaySchedule(),
    ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader
        title={`${greeting}, ${session?.name.split(' ')[0] ?? 'there'}`}
        description={`${stats.appointments.today} appointment${stats.appointments.today === 1 ? '' : 's'} today · ${stats.jobs.active} job card${stats.jobs.active === 1 ? '' : 's'} on the floor`}
        action={
          <>
            <Link
              href="/admin/board"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              <Wrench className="size-4" />
              Workshop board
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast transition hover:brightness-110"
            >
              <TrendingUp className="size-4" />
              Full reports
            </Link>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={formatCurrency(stats.revenue.value)}
          delta={stats.revenue.delta}
          icon={<IndianRupee className="size-5" />}
          footer={`${formatCurrency(stats.revenue.collected)} collected`}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding.value)}
          icon={<Clock className="size-5" />}
          tone="warning"
          footer={`${stats.outstanding.count} unpaid invoice${stats.outstanding.count === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Jobs delivered"
          value={stats.jobs.delivered}
          delta={stats.jobs.delta}
          icon={<Wrench className="size-5" />}
          tone="success"
          footer={`${stats.jobs.active} currently active`}
        />
        <StatCard
          label="Customers"
          value={stats.customers.total}
          delta={stats.customers.delta}
          icon={<Users className="size-5" />}
          tone="accent"
          footer={`${stats.customers.new} added this month · ${stats.vehicles} vehicles`}
        />
      </div>

      {/* Alerts */}
      {(stats.lowStock > 0 || stats.unreadMessages > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {stats.lowStock > 0 ? (
            <Link
              href="/admin/parts?lowStock=1"
              className="flex items-center gap-3.5 rounded-2xl border border-warning/35 bg-warning-soft px-5 py-4 transition hover:brightness-105"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {stats.lowStock} part{stats.lowStock === 1 ? '' : 's'} at or below reorder level
                </p>
                <p className="text-xs text-muted">Reorder before the next service rush.</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-warning" />
            </Link>
          ) : null}

          {stats.unreadMessages > 0 ? (
            <Link
              href="/admin/messages?status=NEW"
              className="flex items-center gap-3.5 rounded-2xl border border-brand/35 bg-brand-soft px-5 py-4 transition hover:brightness-105"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                <Inbox className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {stats.unreadMessages} new enquir{stats.unreadMessages === 1 ? 'y' : 'ies'}
                </p>
                <p className="text-xs text-muted">Waiting on a reply from the service desk.</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-brand" />
            </Link>
          ) : null}
        </div>
      )}

      {/* Charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Billed vs collected"
            subtitle="Last six months, with job volume overlaid"
            icon={<TrendingUp className="size-4.5" />}
          />
          <CardBody className="pr-2 pl-0">
            <RevenueChart data={series} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Job cards by stage"
            subtitle="Where work currently sits"
            icon={<Wrench className="size-4.5" />}
          />
          <CardBody>
            <StatusDonut data={statuses} />
          </CardBody>
        </Card>
      </div>

      {/* Schedule + recent jobs */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Today's schedule"
            subtitle={formatDate(new Date())}
            icon={<CalendarCheck className="size-4.5" />}
            action={
              <Link
                href="/admin/appointments"
                className="text-xs font-semibold text-brand hover:underline"
              >
                View all
              </Link>
            }
          />
          {schedule.length ? (
            <ul className="divide-y divide-line">
              {schedule.slice(0, 7).map((a) => {
                const vehicle = a.vehicle as unknown as { registrationNumber: string; make: string; model: string } | null;
                const customer = a.customer as unknown as { name: string; phone: string } | null;
                const services = (a.services as unknown as { name: string }[]) ?? [];
                return (
                  <li key={String(a._id)} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="w-14 shrink-0 text-center">
                      <span className="block font-display text-sm font-bold text-ink">{a.slot}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {vehicle?.registrationNumber ?? '—'}
                        <span className="ml-2 text-xs font-normal text-muted">
                          {vehicle?.make} {vehicle?.model}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted">
                        {customer?.name} · {services.map((s) => s.name).join(', ') || 'No services'}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<CalendarCheck className="size-6" />}
              title="Nothing booked for today"
              message="A clear floor — good time to chase pending estimates."
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent job cards"
            subtitle="Newest first"
            icon={<Wrench className="size-4.5" />}
            action={
              <Link href="/admin/orders" className="text-xs font-semibold text-brand hover:underline">
                View all
              </Link>
            }
          />
          {recentJobs.length ? (
            <ul className="divide-y divide-line">
              {recentJobs.map((o) => {
                const vehicle = o.vehicle as unknown as { registrationNumber: string } | null;
                const customer = o.customer as unknown as { name: string } | null;
                return (
                  <li key={String(o._id)}>
                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2/60"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand">
                        <CarFront className="size-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          <span className="font-mono text-xs text-brand">{o.code}</span>
                          <span className="ml-2">{vehicle?.registrationNumber}</span>
                        </p>
                        <p className="truncate text-xs text-muted">
                          {customer?.name} · {relativeTime(o.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <StatusBadge status={o.status} />
                        <p className="mt-1 text-xs font-semibold text-ink">
                          {formatCurrency(o.grandTotal)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No job cards yet" message="Convert an appointment to open one." />
          )}
        </Card>
      </div>

      {/* Lists */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Top services by revenue"
            subtitle="All time"
            icon={<Package className="size-4.5" />}
          />
          <CardBody>
            <BarList
              money
              items={topServices.map((s) => ({
                label: s.name,
                value: s.revenue,
                meta: `${s.jobs} jobs`,
              }))}
            />
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Technician performance"
            subtitle="Delivered job cards"
            icon={<Users className="size-4.5" />}
            action={
              <Link
                href="/admin/technicians"
                className="text-xs font-semibold text-brand hover:underline"
              >
                Manage team
              </Link>
            }
          />
          {technicians.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2/50">
                    {['Technician', 'Focus', 'Jobs', 'Revenue', 'Rating'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left text-[11px] font-bold tracking-wider text-subtle uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((t) => (
                    <tr key={t.id} className="border-b border-line/70 last:border-0">
                      <td className="px-5 py-3 font-medium text-ink">{t.name}</td>
                      <td className="px-5 py-3 text-xs text-muted">{t.specialization}</td>
                      <td className="px-5 py-3 font-semibold text-ink">{t.jobs}</td>
                      <td className="px-5 py-3 text-ink">{formatCurrency(t.revenue)}</td>
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
            <EmptyState
              title="No delivered jobs yet"
              message="Performance appears once job cards are delivered."
            />
          )}
        </Card>
      </div>
    </>
  );
}
