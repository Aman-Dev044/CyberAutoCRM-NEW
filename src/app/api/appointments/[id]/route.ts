import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { appointmentUpdateSchema } from '@/lib/validators';
import Appointment from '@/models/Appointment';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(
  async ({ ctx }) => {
    const { id } = await ctx.params;
    const doc = await Appointment.findById(id)
      .populate('customer', 'name phone email code address')
      .populate('vehicle', 'registrationNumber make model year fuelType odometer')
      .populate('services', 'name basePrice estimatedHours category')
      .populate('assignedTechnician', 'name technician')
      .lean();
    if (!doc) throw new ApiError('Appointment not found', 404);
    return ok(doc);
  },
  { permission: 'appointment:view' },
);

export const PATCH = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const payload = await parseBody(req, appointmentUpdateSchema);

    const doc = await Appointment.findById(id);
    if (!doc) throw new ApiError('Appointment not found', 404);

    const statusChanged = payload.status && payload.status !== doc.status;

    Object.assign(doc, {
      ...payload,
      ...(payload.scheduledAt ? { scheduledAt: new Date(payload.scheduledAt) } : {}),
      ...(payload.assignedTechnician !== undefined
        ? { assignedTechnician: payload.assignedTechnician || null }
        : {}),
    });

    if (statusChanged) {
      doc.statusHistory.push({
        status: payload.status!,
        at: new Date(),
        by: user.id as unknown as typeof doc.createdBy,
        note: `Status set to ${payload.status}`,
      });
    }

    await doc.save();

    await logAudit({
      actor: user,
      action: statusChanged ? 'STATUS_CHANGE' : 'UPDATE',
      entity: 'Appointment',
      entityId: id,
      summary: statusChanged
        ? `Appointment ${doc.code} → ${payload.status}`
        : `Updated appointment ${doc.code}`,
      req,
    });

    return ok(doc);
  },
  { permission: 'appointment:update' },
);

export const DELETE = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const doc = await Appointment.findByIdAndDelete(id);
    if (!doc) throw new ApiError('Appointment not found', 404);

    await logAudit({
      actor: user,
      action: 'DELETE',
      entity: 'Appointment',
      entityId: id,
      summary: `Deleted appointment ${doc.code}`,
      req,
    });

    return ok({ deleted: true });
  },
  { permission: 'appointment:delete' },
);
