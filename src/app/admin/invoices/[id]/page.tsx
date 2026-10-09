import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { PageHeader } from '@/components/admin/PageHeader';
import { InvoiceView, type InvoiceDetail } from '@/components/admin/InvoiceView';
import { getPublicSettings } from '@/server/settings';
import Setting from '@/models/Setting';

export const metadata = { title: 'Invoice' };

async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const doc = await Invoice.findById(id)
    .populate('customer', 'name phone email code company gstin address')
    .populate('vehicle', 'registrationNumber make model year')
    .populate('serviceOrder', 'code odometerIn odometerOut')
    .lean();
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc)) as InvoiceDetail;
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([getInvoice(id), getPublicSettings()]);
  if (!invoice) notFound();

  await connectDB();
  const full = await Setting.findOne({ key: 'global' }).lean();

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.number}`}
        description={`${invoice.customer?.name ?? 'Customer'} · ${invoice.vehicle?.registrationNumber ?? 'No vehicle'}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Invoices', href: '/admin/invoices' },
          { label: invoice.number },
        ]}
        className="no-print"
      />

      <InvoiceView
        invoice={invoice}
        garage={{
          name: settings.garage.name,
          address: settings.garage.address,
          phone: settings.garage.phone,
          email: settings.garage.email,
          gstin: full?.garage?.gstin,
        }}
      />
    </>
  );
}
