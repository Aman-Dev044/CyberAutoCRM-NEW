import 'server-only';
import Setting from '@/models/Setting';
import { connectDB } from './db';

/**
 * Notification dispatch seam.
 *
 * Nothing here talks to a provider yet — it reads the toggles from Settings and
 * logs what *would* be sent, so the rest of the app can call it safely today.
 * To go live, replace the bodies of `sendEmail` / `sendSms` with your provider
 * SDK (Resend, SES, Twilio, MSG91, …) and keep the signatures.
 */

type EmailPayload = { to: string; subject: string; body: string };
type SmsPayload = { to: string; body: string };

async function channels() {
  try {
    await connectDB();
    const doc = await Setting.findOne({ key: 'global' }).lean();
    return {
      email: doc?.notifications?.emailEnabled ?? true,
      sms: doc?.notifications?.smsEnabled ?? false,
      reminderHoursBefore: doc?.notifications?.reminderHoursBefore ?? 24,
    };
  } catch {
    return { email: false, sms: false, reminderHoursBefore: 24 };
  }
}

export async function sendEmail(payload: EmailPayload) {
  const { email } = await channels();
  if (!email) return { sent: false, reason: 'email channel disabled' as const };
  console.info('[notify:email]', payload.to, '—', payload.subject);
  return { sent: true as const };
}

export async function sendSms(payload: SmsPayload) {
  const { sms } = await channels();
  if (!sms) return { sent: false, reason: 'sms channel disabled' as const };
  console.info('[notify:sms]', payload.to, '—', payload.body.slice(0, 60));
  return { sent: true as const };
}

/** Convenience wrappers for the events the CRM already knows about. */
export const notify = {
  async bookingConfirmed(opts: { to?: string; phone?: string; code: string; when: string }) {
    const body = `Your booking ${opts.code} is confirmed for ${opts.when}. Track it any time at /track?code=${opts.code}`;
    if (opts.to) await sendEmail({ to: opts.to, subject: `Booking ${opts.code} confirmed`, body });
    if (opts.phone) await sendSms({ to: opts.phone, body });
  },

  async jobReady(opts: { to?: string; phone?: string; code: string; total: string }) {
    const body = `Your vehicle is ready for collection. Job card ${opts.code}, amount due ${opts.total}.`;
    if (opts.to) await sendEmail({ to: opts.to, subject: 'Your vehicle is ready', body });
    if (opts.phone) await sendSms({ to: opts.phone, body });
  },

  async invoiceRaised(opts: { to?: string; number: string; total: string; dueDate: string }) {
    if (!opts.to) return;
    await sendEmail({
      to: opts.to,
      subject: `Invoice ${opts.number}`,
      body: `Invoice ${opts.number} for ${opts.total} is due by ${opts.dueDate}.`,
    });
  },
};
