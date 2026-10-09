import { ApiError, ok, parseBody, route } from '@/lib/api';
import { setSessionCookie, signSession, verifyPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { loginSchema } from '@/lib/validators';
import { STAFF_ROLES } from '@/lib/constants';
import User from '@/models/User';

export const POST = route(
  async ({ req }) => {
    const { email, password } = await parseBody(req, loginSchema);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError('Invalid email or password', 401);
    }
    if (!user.isActive) {
      throw new ApiError('This account has been deactivated. Contact an administrator.', 403);
    }

    const sessionUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customer ? String(user.customer) : null,
      avatarUrl: user.avatarUrl ?? null,
    };

    await setSessionCookie(await signSession(sessionUser));

    user.lastLoginAt = new Date();
    await user.save();

    await logAudit({
      actor: sessionUser,
      action: 'LOGIN',
      entity: 'Auth',
      entityId: sessionUser.id,
      summary: `${user.name} signed in`,
      req,
    });

    return ok({
      user: sessionUser,
      redirectTo: STAFF_ROLES.includes(user.role) ? '/admin' : '/portal',
    });
  },
  { public: true },
);
