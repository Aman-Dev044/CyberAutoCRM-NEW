import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { serviceOrderUpdateSchema } from '@/lib/validators';
import Customer from '@/models/Customer';
import Part from '@/models/Part';
import ServiceOrder from '@/models/ServiceOrder';
import User from '@/models/User';
import Vehicle from '@/models/Vehicle';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(
  async ({ ctx }) => {
    const { id } = await ctx.params;
    const doc = await ServiceOrder.findById(id)
      .populate('customer', 'name phone email code address')
      .populate('vehicle', 'registrationNumber make model year fuelType odometer color')
      .populate('technicians', 'name technician avatarUrl')
      .populate('appointment', 'code scheduledAt slot')
      .populate('invoice', 'number status total balance')
      .lean();
    if (!doc) throw new ApiError('Job card not found', 404);
    return ok(doc);
  },
  { permission: 'order:view' },
);

export const PATCH = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const { workNote, ...payload } = await parseBody(req, serviceOrderUpdateSchema);

    const doc = await ServiceOrder.findById(id);
    if (!doc) throw new ApiError('Job card not found', 404);

    // Technicians may only move their own jobs forward.
    if (user.role === 'TECHNICIAN' && !doc.technicians.some((t) => String(t) === user.id)) {
      throw new ApiError('This job card is not assigned to you', 403);
    }

    const prevStatus = doc.status;

    // Keep inventory honest: only the *delta* between the old and new part
    // lines moves stock, so repeated saves never double-count.
    if (payload.parts) {
      const tally = (lines: { part?: string | null; qty: number }[]) => {
        const map = new Map<string, number>();
        lines.forEach((l) => {
          if (!l.part) return;
          map.set(String(l.part), (map.get(String(l.part)) ?? 0) + (l.qty || 0));
        });
        return map;
      };

      const before = tally(
        doc.parts.map((p) => ({ part: p.part ? String(p.part) : null, qty: p.qty })),
      );
      const after = tally(payload.parts);

      for (const partId of new Set([...before.keys(), ...after.keys()])) {
        const delta = (after.get(partId) ?? 0) - (before.get(partId) ?? 0);
        if (delta !== 0) {
          await Part.findByIdAndUpdate(partId, { $inc: { stockQty: -delta } });
        }
      }
    }

    Object.assign(doc, {
      ...payload,
      ...(payload.appointment !== undefined ? { appointment: payload.appointment || null } : {}),
      ...(payload.promisedAt ? { promisedAt: new Date(payload.promisedAt) } : {}),
    });

    if (payload.status && payload.status !== prevStatus) {
      if (payload.status === 'IN_PROGRESS' && !doc.startedAt) doc.startedAt = new Date();
      if (payload.status === 'READY') doc.completedAt = new Date();
      if (payload.status === 'DELIVERED') {
        doc.deliveredAt = new Date();
        // Delivery is the moment the visit "counts" for the customer + vehicle.
        await Customer.findByIdAndUpdate(doc.customer, {
          $inc: { visitCount: 1, totalSpend: doc.grandTotal },
          lastVisitAt: new Date(),
        });
        await Vehicle.findByIdAndUpdate(doc.vehicle, {
          $inc: { serviceCount: 1 },
          lastServiceAt: new Date(),
          nextServiceDue: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
          ...(doc.odometerOut ? { odometer: doc.odometerOut } : {}),
        });
        if (doc.technicians.length) {
          await User.updateMany(
            { _id: { $in: doc.technicians } },
            { $inc: { 'technician.jobsCompleted': 1 } },
          );
        }
      }

      doc.workLog.push({
        at: new Date(),
        by: user.id as unknown as (typeof doc.workLog)[number]['by'],
        byName: user.name,
        status: payload.status,
        note: workNote?.trim() || `Moved from ${prevStatus} to ${payload.status}`,
      });
    } else if (workNote?.trim()) {
      doc.workLog.push({
        at: new Date(),
        by: user.id as unknown as (typeof doc.workLog)[number]['by'],
        byName: user.name,
        status: doc.status,
        note: workNote.trim(),
      });
    }

    await doc.save();

    await logAudit({
      actor: user,
      action: payload.status && payload.status !== prevStatus ? 'STATUS_CHANGE' : 'UPDATE',
      entity: 'ServiceOrder',
      entityId: id,
      summary: `Job card ${doc.code}${payload.status ? ` → ${payload.status}` : ' updated'}`,
      req,
    });

    return ok(doc);
  },
  { permission: 'order:update' },
);

export const DELETE = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const doc = await ServiceOrder.findByIdAndDelete(id);
    if (!doc) throw new ApiError('Job card not found', 404);

    // Parts that were reserved for this job go back on the shelf.
    for (const line of doc.parts) {
      if (line.part) await Part.findByIdAndUpdate(line.part, { $inc: { stockQty: line.qty } });
    }

    await logAudit({
      actor: user,
      action: 'DELETE',
      entity: 'ServiceOrder',
      entityId: id,
      summary: `Deleted job card ${doc.code}`,
      req,
    });

    return ok({ deleted: true });
  },
  { permission: 'order:delete' },
);
