import { z } from 'zod';
import { ApiError, ok, parseBody, route } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import ServiceOrder from '@/models/ServiceOrder';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional().or(z.literal('')),
});

export const POST = route<Ctx>(
  async ({ req, ctx, user }) => {
    const { id } = await ctx.params;
    const payload = await parseBody(req, schema);

    const order = await ServiceOrder.findOne({ _id: id, customer: user.customerId });
    if (!order) throw new ApiError('Job card not found on your account', 404);
    if (!['READY', 'DELIVERED'].includes(order.status)) {
      throw new ApiError('You can rate a service once it is ready', 400);
    }

    order.customerRating = payload.rating;
    order.customerFeedback = payload.feedback || undefined;
    await order.save();

    return ok({ saved: true });
  },
  { roles: [ROLES.CUSTOMER] },
);
