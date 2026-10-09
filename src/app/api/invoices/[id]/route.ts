import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { invoiceUpdateSchema } from '@/lib/validators';
import Invoice from '@/models/Invoice';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(
  async ({ ctx }) => {
    const { id } = await ctx.params;
    const doc = await Invoice.findById(id)
      .populate('customer', 'name phone email code address gstin company')
      .populate('vehicle', 'registrationNumber make model year')
      .populate('serviceOrder', 'code odometerIn odometerOut')
      .lean();
    if (!doc) throw new ApiError('Invoice not found', 404);
    return ok(doc);
  },
  { permission: 'invoice:view' },
);

export const PATCH = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const payload = await parseBody(req, invoiceUpdateSchema);

    const doc = await Invoice.findById(id);
    if (!doc) throw new ApiError('Invoice not found', 404);
    if (doc.status === 'PAID' && payload.lines) {
      throw new ApiError('A paid invoice cannot be re-costed', 400);
    }

    Object.assign(doc, {
      ...payload,
      ...(payload.dueDate ? { dueDate: new Date(payload.dueDate) } : {}),
    });
    await doc.save();

    await logAudit({
      actor: user,
      action: 'UPDATE',
      entity: 'Invoice',
      entityId: id,
      summary: `Updated invoice ${doc.number}`,
      req,
    });

    return ok(doc);
  },
  { permission: 'invoice:update' },
);

export const DELETE = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const doc = await Invoice.findById(id);
    if (!doc) throw new ApiError('Invoice not found', 404);
    if (doc.amountPaid > 0) {
      throw new ApiError('Invoices with payments can only be voided, not deleted', 400);
    }
    await doc.deleteOne();

    await logAudit({
      actor: user,
      action: 'DELETE',
      entity: 'Invoice',
      entityId: id,
      summary: `Deleted invoice ${doc.number}`,
      req,
    });

    return ok({ deleted: true });
  },
  { permission: 'invoice:delete' },
);
