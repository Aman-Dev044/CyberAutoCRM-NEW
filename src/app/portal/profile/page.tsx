'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, LogOut, Save, User } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Stat';
import { Field, FormRow, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiGet, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { formatDate } from '@/lib/utils';

type Me = {
  user: { id: string; name: string; email: string; phone?: string; lastLoginAt?: string };
};

export default function PortalProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    apiGet<Me>('/api/auth/me')
      .then((data) => {
        setMe(data);
        setProfile({ name: data.user.name, phone: data.user.phone ?? '' });
      })
      .catch((err) => toast.error('Could not load your profile', (err as ApiClientError).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setErrors({});
    try {
      await apiPatch('/api/auth/me', profile);
      toast.success('Profile updated');
      router.refresh();
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not save', e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setSavingPassword(true);
    setErrors({});
    try {
      await apiPatch('/api/auth/password', passwords);
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not change your password', e.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const signOut = async () => {
    await apiPost('/api/auth/logout', {}).catch(() => {});
    router.replace('/login');
  };

  if (!me) return <div className="skeleton h-72 rounded-2xl" />;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">My profile</h1>
          <p className="mt-1.5 text-sm text-muted">
            Keep your contact details current so we can reach you about your car.
          </p>
        </div>
        <Button variant="ghost" onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Your details" icon={<User className="size-4.5" />} />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={me.user.name} size="lg" />
              <div>
                <p className="font-display text-lg font-bold text-ink">{me.user.name}</p>
                <p className="text-sm text-muted">{me.user.email}</p>
                {me.user.lastLoginAt ? (
                  <p className="mt-0.5 text-xs text-subtle">
                    Last sign-in {formatDate(me.user.lastLoginAt, true)}
                  </p>
                ) : null}
              </div>
            </div>

            <FormRow>
              <Field label="Full name" required error={errors.name}>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </Field>
              <Field label="Mobile number" error={errors.phone}>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </Field>
            </FormRow>

            <p className="text-xs text-subtle">
              To change the email on your account, call the service desk.
            </p>

            <Button loading={savingProfile} onClick={saveProfile}>
              <Save className="size-4" />
              Save details
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Password" icon={<KeyRound className="size-4.5" />} />
          <CardBody className="space-y-4">
            <Field label="Current password" required error={errors.currentPassword}>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, currentPassword: e.target.value }))
                }
                autoComplete="current-password"
              />
            </Field>
            <Field
              label="New password"
              required
              error={errors.newPassword}
              hint="At least 8 characters."
            >
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                autoComplete="new-password"
              />
            </Field>
            <Button
              variant="secondary"
              loading={savingPassword}
              disabled={!passwords.currentPassword || passwords.newPassword.length < 8}
              onClick={changePassword}
            >
              <KeyRound className="size-4" />
              Change password
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
