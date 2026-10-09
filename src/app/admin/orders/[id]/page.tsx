import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck, CarFront, Phone, Star, User } from 'lucide-react';
import { connectDB } from '@/lib/db';
import ServiceOrder from '@/models/ServiceOrder';
import { PageHeader } from '@/components/admin/PageHeader';
import { JobCardForm, type OrderDetail } from '@/components/admin/JobCardForm';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Job Card' };

async function getOrder(id: string): Promise<OrderDetail | null> {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;
  await connectDB();
  const doc = await ServiceOrder.findById(id)
    .populate('customer', 'name phone email code')
    .populate('vehicle', 'registrationNumber make model year odometer fuelType')
    .populate('technicians', 'name technician')
    .populate('appointment', 'code scheduledAt slot')
    .populate('invoice', 'number status balance total')
    .lean();
  if (!doc) return null;
  // Mongoose documents carry ObjectIds and Dates; serialise for the client form.
  return JSON.parse(JSON.stringify(doc)) as OrderDetail;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const appointment = (order as unknown as {
    appointment?: { _id: string; code: string; scheduledAt: string; slot: string } | null;
  }).appointment;

  return (
    <>
      <PageHeader
        title={`Job card ${order.code}`}
        description={`Opened ${formatDate(order.createdAt, true)}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Job Cards', href: '/admin/orders' },
          { label: order.code },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.priority} />
            <StatusBadge status={order.status} />
          </div>
        }
      />

      {/* Context strip */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <CarFront className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">Vehicle</p>
            <p className="font-mono text-sm font-bold text-ink">
              {order.vehicle?.registrationNumber ?? '—'}
            </p>
            <p className="truncate text-xs text-muted">
              {order.vehicle?.make} {order.vehicle?.model}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <User className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
              Customer
            </p>
            <p className="truncate text-sm font-bold text-ink">{order.customer?.name ?? '—'}</p>
            {order.customer?.phone ? (
              <a
                href={`tel:${order.customer.phone}`}
                className="flex items-center gap-1 text-xs text-muted hover:text-brand"
              >
                <Phone className="size-3" />
                {order.customer.phone}
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-info-soft text-info">
            <CalendarCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
              Booking
            </p>
            {appointment ? (
              <>
                <Link
                  href="/admin/appointments"
                  className="font-mono text-sm font-bold text-brand hover:underline"
                >
                  {appointment.code}
                </Link>
                <p className="text-xs text-muted">
                  {formatDate(appointment.scheduledAt)} · {appointment.slot}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Walk-in</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
            <Star className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
              Feedback
            </p>
            {(order as unknown as { customerRating?: number }).customerRating ? (
              <>
                <p className="text-sm font-bold text-ink">
                  {(order as unknown as { customerRating: number }).customerRating} / 5
                </p>
                <p className="line-clamp-1 text-xs text-muted">
                  {(order as unknown as { customerFeedback?: string }).customerFeedback ??
                    'No comment left'}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Not rated yet</p>
            )}
          </div>
        </div>
      </div>

      <JobCardForm order={order} />
    </>
  );
}
