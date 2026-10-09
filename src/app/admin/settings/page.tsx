'use client';

import { useEffect, useState } from 'react';
import { Bell, Building2, Clock, IndianRupee, Save } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, FormRow, Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiGet, apiPatch, type ApiClientError } from '@/lib/client';

type Settings = {
  garage: {
    name: string;
    tagline?: string;
    email?: string;
    phone?: string;
    altPhone?: string;
    address?: string;
    gstin?: string;
    logoUrl?: string;
  };
  finance: { currency: string; taxRate: number; invoicePrefix: string; paymentTermsDays: number };
  operations: {
    openTime: string;
    closeTime: string;
    weekendOpenTime?: string;
    weekendCloseTime?: string;
    slotMinutes: number;
    maxDailyAppointments: number;
    bayCount: number;
  };
  notifications: { emailEnabled: boolean; smsEnabled: boolean; reminderHoursBefore: number };
};

export default function SettingsPage() {
  const toast = useToast();
  const [data, setData] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Settings>('/api/settings')
      .then(setData)
      .catch((err) => toast.error('Could not load settings', (err as ApiClientError).message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSection = async (section: keyof Settings) => {
    if (!data) return;
    setSaving(section);
    try {
      await apiPatch('/api/settings', { [section]: data[section] });
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Could not save', (err as ApiClientError).message);
    } finally {
      setSaving(null);
    }
  };

  const update = <S extends keyof Settings>(
    section: S,
    patch: Partial<Settings[S]>,
  ) => setData((d) => (d ? { ...d, [section]: { ...d[section], ...patch } } : d));

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Settings" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]} />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workshop profile, billing defaults, operating hours and reminders."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Garage profile */}
        <Card>
          <CardHeader
            title="Workshop profile"
            subtitle="Shown on the public site and on every invoice"
            icon={<Building2 className="size-4.5" />}
          />
          <CardBody className="space-y-4">
            <Field label="Workshop name" required>
              <Input
                value={data.garage.name}
                onChange={(e) => update('garage', { name: e.target.value })}
              />
            </Field>
            <Field label="Tagline" hint="Appears in the website hero.">
              <Input
                value={data.garage.tagline ?? ''}
                onChange={(e) => update('garage', { tagline: e.target.value })}
              />
            </Field>
            <FormRow>
              <Field label="Public email">
                <Input
                  type="email"
                  value={data.garage.email ?? ''}
                  onChange={(e) => update('garage', { email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={data.garage.phone ?? ''}
                  onChange={(e) => update('garage', { phone: e.target.value })}
                />
              </Field>
            </FormRow>
            <Field label="Address">
              <Textarea
                rows={2}
                value={data.garage.address ?? ''}
                onChange={(e) => update('garage', { address: e.target.value })}
              />
            </Field>
            <Field label="GSTIN">
              <Input
                value={data.garage.gstin ?? ''}
                onChange={(e) => update('garage', { gstin: e.target.value.toUpperCase() })}
                className="font-mono uppercase"
              />
            </Field>
            <Button loading={saving === 'garage'} onClick={() => saveSection('garage')}>
              <Save className="size-4" />
              Save profile
            </Button>
          </CardBody>
        </Card>

        {/* Finance */}
        <Card>
          <CardHeader
            title="Billing defaults"
            subtitle="Applied to new invoices and job cards"
            icon={<IndianRupee className="size-4.5" />}
          />
          <CardBody className="space-y-4">
            <FormRow>
              <Field label="Currency" hint="ISO code, e.g. INR.">
                <Input
                  value={data.finance.currency}
                  onChange={(e) => update('finance', { currency: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
              </Field>
              <Field label="Default GST %">
                <Input
                  type="number"
                  value={data.finance.taxRate}
                  onChange={(e) => update('finance', { taxRate: Number(e.target.value) })}
                />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Invoice prefix" hint="INV-2026-0001">
                <Input
                  value={data.finance.invoicePrefix}
                  onChange={(e) =>
                    update('finance', { invoicePrefix: e.target.value.toUpperCase() })
                  }
                  className="font-mono uppercase"
                />
              </Field>
              <Field label="Payment terms (days)">
                <Input
                  type="number"
                  value={data.finance.paymentTermsDays}
                  onChange={(e) =>
                    update('finance', { paymentTermsDays: Number(e.target.value) })
                  }
                />
              </Field>
            </FormRow>
            <Button loading={saving === 'finance'} onClick={() => saveSection('finance')}>
              <Save className="size-4" />
              Save billing
            </Button>
          </CardBody>
        </Card>

        {/* Operations */}
        <Card>
          <CardHeader
            title="Operating hours & capacity"
            subtitle="Controls what the public booking form will accept"
            icon={<Clock className="size-4.5" />}
          />
          <CardBody className="space-y-4">
            <FormRow>
              <Field label="Weekday open">
                <Input
                  type="time"
                  value={data.operations.openTime}
                  onChange={(e) => update('operations', { openTime: e.target.value })}
                />
              </Field>
              <Field label="Weekday close">
                <Input
                  type="time"
                  value={data.operations.closeTime}
                  onChange={(e) => update('operations', { closeTime: e.target.value })}
                />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Weekend open">
                <Input
                  type="time"
                  value={data.operations.weekendOpenTime ?? ''}
                  onChange={(e) => update('operations', { weekendOpenTime: e.target.value })}
                />
              </Field>
              <Field label="Weekend close">
                <Input
                  type="time"
                  value={data.operations.weekendCloseTime ?? ''}
                  onChange={(e) => update('operations', { weekendCloseTime: e.target.value })}
                />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="Slot length (min)">
                <Input
                  type="number"
                  value={data.operations.slotMinutes}
                  onChange={(e) =>
                    update('operations', { slotMinutes: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Service bays" hint="Caps bookings per slot.">
                <Input
                  type="number"
                  value={data.operations.bayCount}
                  onChange={(e) => update('operations', { bayCount: Number(e.target.value) })}
                />
              </Field>
              <Field label="Max per day">
                <Input
                  type="number"
                  value={data.operations.maxDailyAppointments}
                  onChange={(e) =>
                    update('operations', { maxDailyAppointments: Number(e.target.value) })
                  }
                />
              </Field>
            </FormRow>
            <Button loading={saving === 'operations'} onClick={() => saveSection('operations')}>
              <Save className="size-4" />
              Save operations
            </Button>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader
            title="Reminders"
            subtitle="How customers hear from you before a booking"
            icon={<Bell className="size-4.5" />}
          />
          <CardBody className="space-y-4">
            <Checkbox
              label="Send email reminders and confirmations"
              checked={data.notifications.emailEnabled}
              onChange={(e) => update('notifications', { emailEnabled: e.target.checked })}
            />
            <Checkbox
              label="Send SMS reminders"
              checked={data.notifications.smsEnabled}
              onChange={(e) => update('notifications', { smsEnabled: e.target.checked })}
            />
            <Field label="Remind this many hours before" hint="24 hours is the usual sweet spot.">
              <Input
                type="number"
                value={data.notifications.reminderHoursBefore}
                onChange={(e) =>
                  update('notifications', { reminderHoursBefore: Number(e.target.value) })
                }
              />
            </Field>

            <p className="rounded-xl bg-surface-2/60 p-3.5 text-xs leading-relaxed text-muted">
              Toggles are stored and read by the reminder job. Wire your own email or SMS provider
              into <code className="text-brand">src/lib/notifications</code> to start sending.
            </p>

            <Button
              loading={saving === 'notifications'}
              onClick={() => saveSection('notifications')}
            >
              <Save className="size-4" />
              Save reminders
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
