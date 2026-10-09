import { ApiError, ok, parseBody, route } from '@/lib/api';
import { hashPassword, setSessionCookie, signSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { registerSchema } from '@/lib/validators';
import { ROLES } from '@/lib/constants';
import { generateCode } from '@/lib/utils';
import Customer from '@/models/Customer';
import User from '@/models/User';

/** Public self-service signup: always creates a CUSTOMER plus its CRM record. */
export const POST = route(
  async ({ req }) => {
    const { name, email, password, phone } = await parseBody(req, registerSchema);
    const normalizedEmail = email.toLowerCase();

    if (await User.exists({ email: normalizedEmail })) {
      throw new ApiError('An account with this email already exists', 409);
    }

    // Reuse an existing walk-in customer record if the phone/email already known.
    let customer = await Customer.findOne({
      $or: [{ email: normalizedEmail }, { phone }],
    });

    if (!customer) {
      customer = await Customer.create({
        code: generateCode('CUS'),
        name,
        email: normalizedEmail,
        phone,
        preferredContact: 'PHONE',
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      phone,
      role: ROLES.CUSTOMER,
      customer: customer._id,
    });

    customer.user = user._id;
    await customer.save();

    const sessionUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: String(customer._id),
      avatarUrl: null,
    };

    await setSessionCookie(await signSession(sessionUser));

    await logAudit({
      actor: sessionUser,
      action: 'REGISTER',
      entity: 'Auth',
      entityId: sessionUser.id,
      summary: `${name} created a customer account`,
      req,
    });

    return ok({ user: sessionUser, redirectTo: '/portal' }, { status: 201 });
  },
  { public: true },
);
