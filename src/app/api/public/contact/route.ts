import { ok, parseBody, route } from '@/lib/api';
import { contactSchema } from '@/lib/validators';
import ContactMessage from '@/models/ContactMessage';

export const POST = route(
  async ({ req }) => {
    const payload = await parseBody(req, contactSchema);
    const doc = await ContactMessage.create(payload);
    return ok({ id: String(doc._id), received: true }, { status: 201 });
  },
  { public: true },
);
