import { ok, parseBody, route } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import { settingsSchema } from '@/lib/validators';
import Setting from '@/models/Setting';

async function globalSettings() {
  let doc = await Setting.findOne({ key: 'global' });
  if (!doc) doc = await Setting.create({ key: 'global' });
  return doc;
}

export const GET = route(
  async () => {
    const doc = await globalSettings();
    return ok(doc);
  },
  { permission: 'settings:view' },
);

export const PATCH = route(
  async ({ req, user }) => {
    const payload = await parseBody(req, settingsSchema);
    const doc = await globalSettings();

    // Merge section-by-section so a partial save never wipes sibling fields.
    (['garage', 'finance', 'operations', 'notifications'] as const).forEach((section) => {
      const patch = payload[section];
      if (patch) {
        doc.set(section, { ...(doc.get(section) ?? {}), ...patch });
      }
    });

    await doc.save();

    await logAudit({
      actor: user,
      action: 'UPDATE',
      entity: 'Setting',
      entityId: 'global',
      summary: `Updated ${Object.keys(payload).join(', ')} settings`,
      req,
    });

    return ok(doc);
  },
  { permission: 'settings:update' },
);
