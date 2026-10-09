import { z } from 'zod';
import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import ContactMessage from '@/models/ContactMessage';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']).optional(),
  reply: z.string().max(4000).optional(),
});

export const PATCH = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const payload = await parseBody(req, schema);

    const doc = await ContactMessage.findById(id);
    if (!doc) throw new ApiError('Message not found', 404);

    if (payload.status) doc.status = payload.status;
    if (payload.reply !== undefined) {
      doc.reply = payload.reply;
      doc.status = payload.status ?? 'REPLIED';
    }
    doc.handledBy = user.id as unknown as typeof doc.handledBy;
    await doc.save();

    await logAudit({
      actor: user,
      action: 'UPDATE',
      entity: 'ContactMessage',
      entityId: id,
      summary: `Enquiry from ${doc.name} marked ${doc.status}`,
      req,
    });

    return ok(doc);
  },
  { permission: 'message:update' },
);

export const DELETE = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const doc = await ContactMessage.findByIdAndDelete(id);
    if (!doc) throw new ApiError('Message not found', 404);
    await logAudit({
      actor: user,
      action: 'DELETE',
      entity: 'ContactMessage',
      entityId: id,
      summary: `Deleted enquiry from ${doc.name}`,
      req,
    });
    return ok({ deleted: true });
  },
  { permission: 'message:update' },
);
