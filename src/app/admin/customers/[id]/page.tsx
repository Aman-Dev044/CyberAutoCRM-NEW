import { notFound } from 'next/navigation';
import Link from 'next/link';
import mongoose from 'mongoose';
import {
  Building2,
  CalendarCheck,
  CarFront,
  FileText,
  Mail,
  MapPin,
  Phone,
  Wrench,
} from 'lucide-react';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import Customer from '@/models/Customer';
import Invoice from '@/models/Invoice';
import ServiceOrder from '@/models/ServiceOrder';
import Vehicle from '@/models/Vehicle';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/Stat';
import { EmptyState } from '@/components/ui/DataTable';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export const metadata = { title: 'Customer' };

type CustomerView = {
  _id: string;
  name: string;
  code: string;
  email?: string;
  phone: string;
  altPhone?: string;
  customerType: string;
  company?: string;
  gstin?: string;
  address?: { line1?: string; city?: string; state?: string; pincode?: string };
  notes?: string;
  tags?: string[];
  totalSpend: number;
  visitCount: number;
  lastVisitAt?: string;
  createdAt: string;
};

type VehicleView = {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  fuelType: string;
  odometer: number;
  serviceCount: number;
};

type AppointmentView = {
  _id: string;
  code: string;
  scheduledAt: string;
  slot: string;
  status: string;
};

type OrderView = {
  _id: string;
  code: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  vehicle?: { registrationNumber?: string } | null;
};

type InvoiceView = {
  _id: string;
  number: string;
  status: string;
  total: number;
  issuedAt: string;
};

type PageData = {
  customer: CustomerView;
  vehicles: VehicleView[];
  appointments: AppointmentView[];
  orders: OrderView[];
  invoices: InvoiceView[];
  due: number;
};

/** Mongoose docs carry ObjectIds and Dates — serialise before crossing to JSX. */
const plain = <T,>(value: unknown): T => JSON.parse(JSON.stringify(value)) as T;

async function getData(id: string): Promise<PageData | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();

  const customer = await Customer.findById(id).lean();
  if (!customer) return null;

  const [vehicles, appointments, orders, invoices, due] = await Promise.all([
    Vehicle.find({ customer: id }).sort({ createdAt: -1 }).lean(),
    Appointment.find({ customer: id }).sort({ scheduledAt: -1 }).limit(8).lean(),
    ServiceOrder.find({ customer: id })
      .populate('vehicle', 'registrationNumber')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Invoice.find({ customer: id }).sort({ issuedAt: -1 }).limit(8).lean(),
    Invoice.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(id),
          status: { $in: ['SENT', 'PARTIAL', 'OVERDUE'] },
        },
      },
      { $group: { _id: null, balance: { $sum: '$balance' } } },
    ]),
  ]);

  return {
    customer: plain<CustomerView>(customer),
    vehicles: plain<VehicleView[]>(vehicles),
    appointments: plain<AppointmentView[]>(appointments),
    orders: plain<OrderView[]>(orders),
    invoices: plain<InvoiceView[]>(invoices),
    due: (due[0]?.balance as number) ?? 0,
  };
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  const { customer: c, vehicles, appointments, orders, invoices, due } = data;

  return (
    <>
      <PageHeader
        title={c.name}
        description={`${c.customerType === 'BUSINESS' ? 'Business account' : 'Individual'} · ${c.code} · on the books since ${formatDate(c.createdAt)}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Customers', href: '/admin/customers' },
          { label: c.name },
        ]}
        action={
          <Link
            href="/admin/appointments?new=1"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast"
          >
            <CalendarCheck className="size-4" />
            Book a service
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lifetime spend"
          value={formatCurrency(c.totalSpend)}
          icon={<FileText className="size-5" />}
        />
        <StatCard
          label="Visits"
          value={c.visitCount}
          icon={<Wrench className="size-5" />}
          tone="success"
          footer={c.lastVisitAt ? `Last visit ${formatDate(c.lastVisitAt)}` : 'No visits yet'}
        />
        <StatCard
          label="Vehicles"
          value={vehicles.length}
          icon={<CarFront className="size-5" />}
          tone="accent"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(due)}
          icon={<FileText className="size-5" />}
          tone={due ? 'warning' : 'info'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader title="Profile" />
          <CardBody className="space-y-4 text-sm">
            <div className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand" />
              <div>
                <a href={`tel:${c.phone}`} className="font-medium text-ink hover:text-brand">
                  {c.phone}
                </a>
                {c.altPhone ? <p className="text-xs text-muted">{c.altPhone}</p> : null}
              </div>
            </div>

            {c.email ? (
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
                <a href={`mailto:${c.email}`} className="break-all text-ink hover:text-brand">
                  {c.email}
                </a>
              </div>
            ) : null}

            {c.address?.line1 ? (
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="text-muted">
                  {c.address.line1}
                  {c.address.city ? `, ${c.address.city}` : ''}
                  {c.address.state ? `, ${c.address.state}` : ''}
                  {c.address.pincode ? ` — ${c.address.pincode}` : ''}
                </p>
              </div>
            ) : null}

            {c.company ? (
              <div className="flex gap-3">
                <Building2 className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <p className="font-medium text-ink">{c.company}</p>
                  {c.gstin ? <p className="font-mono text-xs text-muted">{c.gstin}</p> : null}
                </div>
              </div>
            ) : null}

            {c.tags?.length ? (
              <div className="flex flex-wrap gap-1.5 border-t border-line pt-4">
                {c.tags.map((t) => (
                  <Badge key={t} tone="brand">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : null}

            {c.notes ? (
              <div className="border-t border-line pt-4">
                <p className="text-xs font-bold tracking-wide text-subtle uppercase">Notes</p>
                <p className="mt-1.5 leading-relaxed text-muted">{c.notes}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Vehicles"
              subtitle={`${vehicles.length} on this account`}
              icon={<CarFront className="size-4.5" />}
            />
            {vehicles.length ? (
              <ul className="divide-y divide-line">
                {vehicles.map((v) => (
                  <li key={v._id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold text-ink">
                        {v.registrationNumber}
                      </p>
                      <p className="text-xs text-muted">
                        {v.make} {v.model}
                        {v.variant ? ` · ${v.variant}` : ''} · {v.year} · {v.fuelType}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-muted">{formatNumber(v.odometer)} km</p>
                      <p className="text-subtle">
                        {v.serviceCount ? `${v.serviceCount} services` : 'No services yet'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No vehicles yet" message="Add one from the Vehicles page." />
            )}
          </Card>

          <Card>
            <CardHeader
              title="Job cards"
              subtitle="Most recent first"
              icon={<Wrench className="size-4.5" />}
            />
            {orders.length ? (
              <ul className="divide-y divide-line">
                {orders.map((o) => (
                  <li key={o._id}>
                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="flex flex-wrap items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-bold text-brand">{o.code}</p>
                        <p className="text-xs text-muted">
                          {o.vehicle?.registrationNumber} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={o.status} />
                      <p className="w-24 text-right text-sm font-semibold text-ink">
                        {formatCurrency(o.grandTotal)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No job cards yet" />
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Appointments" icon={<CalendarCheck className="size-4.5" />} />
              {appointments.length ? (
                <ul className="divide-y divide-line">
                  {appointments.map((a) => (
                    <li key={a._id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] font-bold text-brand">{a.code}</p>
                        <p className="truncate text-xs text-muted">
                          {formatDate(a.scheduledAt)} · {a.slot}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No appointments" />
              )}
            </Card>

            <Card>
              <CardHeader title="Invoices" icon={<FileText className="size-4.5" />} />
              {invoices.length ? (
                <ul className="divide-y divide-line">
                  {invoices.map((inv) => (
                    <li key={inv._id}>
                      <Link
                        href={`/admin/invoices/${inv._id}`}
                        className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-2/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[11px] font-bold text-brand">
                            {inv.number}
                          </p>
                          <p className="text-xs text-muted">{formatDate(inv.issuedAt)}</p>
                        </div>
                        <StatusBadge status={inv.status} />
                        <p className="text-sm font-semibold text-ink">
                          {formatCurrency(inv.total)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No invoices" />
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
