import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { paymentSchema } from '@/lib/validators';
import { formatCurrency } from '@/lib/utils';
import Invoice from '@/models/Invoice';

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const payload = await parseBody(req, paymentSchema);

    const invoice = await Invoice.findById(id);
    if (!invoice) throw new ApiError('Invoice not found', 404);
    if (invoice.status === 'VOID') throw new ApiError('This invoice is void', 400);

    const remaining = invoice.balance;
    if (payload.amount > remaining + 0.5) {
      throw new ApiError(
        `Payment exceeds the outstanding balance of ${formatCurrency(remaining)}`,
        400,
      );
    }

    invoice.payments.push({
      at: new Date(),
      amount: payload.amount,
      method: payload.method,
      reference: payload.reference || undefined,
      receivedBy: user.id as unknown as (typeof invoice.payments)[number]['receivedBy'],
    });
    if (invoice.status === 'DRAFT') invoice.status = 'SENT';
    await invoice.save();

    await logAudit({
      actor: user,
      action: 'PAYMENT',
      entity: 'Invoice',
      entityId: id,
      summary: `Received ${formatCurrency(payload.amount)} on ${invoice.number} via ${payload.method}`,
      meta: { method: payload.method, reference: payload.reference },
      req,
    });

    return ok(invoice, { status: 201 });
  },
  { permission: 'invoice:pay' },
);
