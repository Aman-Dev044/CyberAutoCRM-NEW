'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, LogOut, Save, ShieldCheck, User } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Stat';
import { Field, FormRow, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiGet, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

type Me = {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: Role;
    avatarUrl?: string;
    lastLoginAt?: string;
    technician?: { specialization?: string; skills?: string[]; employeeId?: string };
  };
  permissions: string[];
};

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState({ name: '', phone: '', avatarUrl: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    apiGet<Me>('/api/auth/me')
      .then((data) => {
        setMe(data);
        setProfile({
          name: data.user.name,
          phone: data.user.phone ?? '',
          avatarUrl: data.user.avatarUrl ?? '',
        });
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

  if (!me) {
    return (
      <>
        <PageHeader title="My profile" breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Profile' }]} />
        <div className="skeleton h-72 rounded-2xl" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My profile"
        description="Your details, your password, and exactly what your role can do."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Profile' }]}
        action={
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Details" icon={<User className="size-4.5" />} />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={me.user.name} src={me.user.avatarUrl} size="lg" />
                <div>
                  <p className="font-display text-lg font-bold text-ink">{me.user.name}</p>
                  <p className="text-sm text-muted">{me.user.email}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={me.user.role} />
                  </div>
                </div>
              </div>

              <FormRow>
                <Field label="Full name" required error={errors.name}>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Field>
              </FormRow>

              <Field
                label="Avatar URL"
                hint="Any public image URL; leave blank to use your initials."
                error={errors.avatarUrl}
              >
                <Input
                  value={profile.avatarUrl}
                  onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </Field>

              <p className="text-xs text-subtle">
                Email and role are managed by an administrator.
              </p>

              <Button loading={savingProfile} onClick={saveProfile}>
                <Save className="size-4" />
                Save details
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Password"
              subtitle="Use something you do not reuse elsewhere"
              icon={<KeyRound className="size-4.5" />}
            />
            <CardBody className="space-y-4">
              <FormRow>
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
              </FormRow>
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

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Session" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Role</span>
                <span className="font-semibold text-ink">{ROLE_LABELS[me.user.role]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Last sign-in</span>
                <span className="text-ink">
                  {me.user.lastLoginAt ? formatDate(me.user.lastLoginAt, true) : '—'}
                </span>
              </div>
              {me.user.technician?.employeeId ? (
                <div className="flex justify-between">
                  <span className="text-muted">Employee ID</span>
                  <span className="font-mono text-ink">{me.user.technician.employeeId}</span>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="What you can do"
              subtitle={`${me.permissions.length} permissions`}
              icon={<ShieldCheck className="size-4.5" />}
            />
            <CardBody>
              <div className="flex flex-wrap gap-1.5">
                {me.permissions.map((p) => (
                  <Badge key={p} tone="neutral">
                    <span className="font-mono text-[10px]">{p}</span>
                  </Badge>
                ))}
                {!me.permissions.length ? (
                  <p className="text-xs text-muted">No back-office permissions on this role.</p>
                ) : null}
              </div>
            </CardBody>
          </Card>

          {me.user.technician?.skills?.length ? (
            <Card>
              <CardHeader title="Your skills" />
              <CardBody>
                <div className="flex flex-wrap gap-1.5">
                  {me.user.technician.skills.map((s) => (
                    <Badge key={s} tone="brand">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}
