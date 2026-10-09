import { ApiError, ok, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import Invoice from '@/models/Invoice';
import ServiceOrder from '@/models/ServiceOrder';
import Setting from '@/models/Setting';

type Ctx = { params: Promise<{ id: string }> };

async function nextInvoiceNumber(prefix: string) {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({
    number: new RegExp(`^${prefix}-${year}-`),
  });
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
}

/** Generates (once) an invoice from a job card's labour + parts lines. */
export const POST = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;

    const order = await ServiceOrder.findById(id);
    if (!order) throw new ApiError('Job card not found', 404);
    if (order.invoice) throw new ApiError('This job card is already invoiced', 409);
    if (!order.items.length && !order.parts.length) {
      throw new ApiError('Add labour or parts before invoicing', 400);
    }

    const settings = await Setting.findOne({ key: 'global' }).lean();
    const prefix = settings?.finance?.invoicePrefix ?? 'INV';
    const termsDays = settings?.finance?.paymentTermsDays ?? 7;

    const invoice = await Invoice.create({
      number: await nextInvoiceNumber(prefix),
      customer: order.customer,
      vehicle: order.vehicle,
      serviceOrder: order._id,
      lines: [
        ...order.items.map((i) => ({
          description: i.name,
          qty: i.qty,
          unitPrice: i.price,
          kind: 'LABOUR' as const,
        })),
        ...order.parts.map((p) => ({
          description: `${p.name}${p.sku ? ` (${p.sku})` : ''}`,
          qty: p.qty,
          unitPrice: p.unitPrice,
          kind: 'PART' as const,
        })),
      ],
      discount: order.discount,
      taxRate: order.taxRate,
      status: 'SENT',
      issuedAt: new Date(),
      dueDate: new Date(Date.now() + termsDays * 86400000),
      createdBy: user.id,
    });

    order.invoice = invoice._id;
    await order.save();

    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: String(invoice._id),
      summary: `Invoice ${invoice.number} raised for job card ${order.code}`,
      req,
    });

    return ok(invoice, { status: 201 });
  },
  { permission: 'invoice:create' },
);
