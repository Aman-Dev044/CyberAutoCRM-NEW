import { ApiError, ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { ROLES } from '@/lib/constants';
import { vehicleSchema } from '@/lib/validators';
import Vehicle from '@/models/Vehicle';

const schema = vehicleSchema.omit({ customer: true });

export const GET = route(
  async ({ user }) => {
    if (!user.customerId) throw new ApiError('No customer record linked to this account', 400);
    const items = await Vehicle.find({ customer: user.customerId }).sort({ createdAt: -1 }).lean();
    return ok({ items, total: items.length });
  },
  { roles: [ROLES.CUSTOMER] },
);

export const POST = route(
  async ({ req, user }) => {
    if (!user.customerId) throw new ApiError('No customer record linked to this account', 400);
    const payload = await parseBody(req, schema);

    const registration = payload.registrationNumber.toUpperCase().replace(/\s+/g, '');
    if (await Vehicle.exists({ registrationNumber: registration })) {
      throw new ApiError('That registration number is already on file', 409);
    }

    const vehicle = await Vehicle.create({
      ...payload,
      registrationNumber: registration,
      customer: user.customerId,
      insuranceExpiry: payload.insuranceExpiry ? new Date(payload.insuranceExpiry) : undefined,
      pucExpiry: payload.pucExpiry ? new Date(payload.pucExpiry) : undefined,
    });

    await logAudit({
      actor: user,
      action: 'CREATE',
      entity: 'Vehicle',
      entityId: String(vehicle._id),
      summary: `Customer added vehicle ${registration}`,
      req,
    });

    return ok(vehicle, { status: 201 });
  },
  { roles: [ROLES.CUSTOMER] },
);
