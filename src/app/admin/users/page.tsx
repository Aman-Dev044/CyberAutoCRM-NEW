'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { KeyRound, Pencil, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Stat';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Checkbox, Field, FormRow, Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useCollection } from '@/hooks/useCollection';
import { apiDelete, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/constants';
import { ROLE_PERMISSIONS } from '@/lib/rbac';
import { formatDate, relativeTime } from '@/lib/utils';

type Row = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  avatarUrl?: string;
  technician?: {
    employeeId?: string;
    specialization?: string;
    skills?: string[];
    hourlyRate?: number;
    availability?: string;
  };
};

const EMPTY = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'TECHNICIAN' as Role,
  isActive: true,
  technician: {
    employeeId: '',
    specialization: '',
    skills: '',
    hourlyRate: '450',
    availability: 'AVAILABLE',
  },
};

export default function UsersPage() {
  const toast = useToast();
  const params = useSearchParams();

  const list = useCollection<Row>('/api/users', {
    role: params.get('role') ?? 'ALL',
    limit: 25,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [resetTarget, setResetTarget] = useState<Row | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, role: (params.get('role') as Role) ?? 'TECHNICIAN' });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setErrors({});
    setForm({
      name: row.name,
      email: row.email,
      password: '',
      phone: row.phone ?? '',
      role: row.role,
      isActive: row.isActive,
      technician: {
        employeeId: row.technician?.employeeId ?? '',
        specialization: row.technician?.specialization ?? '',
        skills: (row.technician?.skills ?? []).join(', '),
        hourlyRate: String(row.technician?.hourlyRate ?? 450),
        availability: row.technician?.availability ?? 'AVAILABLE',
      },
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.role === ROLES.TECHNICIAN) {
        payload.technician = {
          employeeId: form.technician.employeeId,
          specialization: form.technician.specialization,
          skills: form.technician.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          hourlyRate: Number(form.technician.hourlyRate),
          availability: form.technician.availability,
        };
      }
      if (form.password) payload.password = form.password;

      if (editing) {
        await apiPatch(`/api/users/${editing._id}`, payload);
        toast.success('Account updated');
      } else {
        await apiPost('/api/users', payload);
        toast.success('Account created', `${form.name} can now sign in.`);
      }
      setOpen(false);
      list.refresh();
    } catch (err) {
      const e = err as ApiClientError;
      setErrors(fieldErrors(e.details));
      toast.error('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    try {
      await apiPatch(`/api/users/${resetTarget._id}`, { password: newPassword });
      toast.success('Password reset', `Share the new password with ${resetTarget.name}.`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      toast.error('Reset failed', (err as ApiClientError).message);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/users/${deleteTarget._id}`);
      toast.success('Account deleted');
      setDeleteTarget(null);
      list.refresh();
    } catch (err) {
      toast.error('Delete failed', (err as ApiClientError).message);
    }
  };

  const toggleActive = async (row: Row) => {
    try {
      await apiPatch(`/api/users/${row._id}`, { isActive: !row.isActive });
      toast.success(row.isActive ? 'Account deactivated' : 'Account reactivated');
      list.refresh();
    } catch (err) {
      toast.error('Update failed', (err as ApiClientError).message);
    }
  };

  const roleCounts = (list.data?.roleCounts as Record<string, number>) ?? {};

  const columns: Column<Row>[] = [
    {
      key: 'user',
      header: 'Account',
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={r.name} src={r.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[11px] text-muted">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (r) => <StatusBadge status={r.role} /> },
    {
      key: 'phone',
      header: 'Phone',
      hideBelow: 'md',
      render: (r) => <span className="text-sm text-muted">{r.phone || '—'}</span>,
    },
    {
      key: 'specialization',
      header: 'Focus',
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-xs text-muted">{r.technician?.specialization ?? '—'}</span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last sign-in',
      hideBelow: 'md',
      render: (r) => (
        <div>
          <p className="text-xs text-ink">
            {r.lastLoginAt ? relativeTime(r.lastLoginAt) : 'Never'}
          </p>
          <p className="text-[11px] text-subtle">joined {formatDate(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <button type="button" onClick={() => toggleActive(r)} title="Toggle active">
          <Badge tone={r.isActive ? 'success' : 'danger'} dot>
            {r.isActive ? 'Active' : 'Disabled'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setResetTarget(r);
              setNewPassword('');
            }}
            className="rounded-lg p-1.5 text-muted transition hover:bg-warning-soft hover:text-warning"
            title="Reset password"
          >
            <KeyRound className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
            title="Edit"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Staff and customer logins, with the permissions each role carries."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users & Roles' }]}
        action={
          <Button onClick={openCreate}>
            <UserPlus className="size-4" />
            Add user
          </Button>
        }
      />

      {/* Role summary */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => list.setParam('role', role)}
            className={`rounded-2xl border p-4 text-left transition ${
              list.params.role === role
                ? 'border-brand bg-brand-soft'
                : 'border-line bg-surface hover:border-brand/40'
            }`}
          >
            <p className="text-[11px] font-bold tracking-wide text-subtle uppercase">
              {ROLE_LABELS[role]}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-ink">{roleCounts[role] ?? 0}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {role === ROLES.SUPER_ADMIN
                ? 'Full access'
                : `${ROLE_PERMISSIONS[role].length} permissions`}
            </p>
          </button>
        ))}
      </div>

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Name, email or phone…"
          />
          <FilterSelect
            label="Role"
            value={String(list.params.role ?? 'ALL')}
            onChange={(v) => list.setParam('role', v)}
            options={(Object.keys(ROLE_LABELS) as Role[]).map((r) => ({
              value: r,
              label: ROLE_LABELS[r],
            }))}
          />
          <FilterSelect
            label="Status"
            value={String(list.params.isActive ?? 'ALL')}
            onChange={(v) => list.setParam('isActive', v)}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Disabled' },
            ]}
          />
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          emptyTitle="No accounts found"
        />

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          onPage={(p) => list.setParam('page', p)}
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Create an account'}
        description="Staff roles decide which screens and actions are available."
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              {editing ? 'Save changes' : 'Create account'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <Field label="Full name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Role" required error={errors.role}>
              <Select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              >
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
          </FormRow>

          <Field
            label={editing ? 'New password' : 'Password'}
            required={!editing}
            error={errors.password}
            hint={editing ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}
          >
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editing ? '••••••••' : 'Set an initial password'}
            />
          </Field>

          {form.role === ROLES.TECHNICIAN ? (
            <div className="space-y-4 rounded-xl border border-line bg-surface-2/40 p-4">
              <p className="text-xs font-bold tracking-wide text-subtle uppercase">
                Technician profile
              </p>
              <FormRow>
                <Field label="Employee ID">
                  <Input
                    value={form.technician.employeeId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        technician: { ...f.technician, employeeId: e.target.value },
                      }))
                    }
                    placeholder="EMP-001"
                  />
                </Field>
                <Field label="Specialisation">
                  <Input
                    value={form.technician.specialization}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        technician: { ...f.technician, specialization: e.target.value },
                      }))
                    }
                    placeholder="Engine & Transmission"
                  />
                </Field>
              </FormRow>
              <Field label="Skills" hint="Comma separated.">
                <Input
                  value={form.technician.skills}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      technician: { ...f.technician, skills: e.target.value },
                    }))
                  }
                  placeholder="Clutch, Timing belt, OBD-II"
                />
              </Field>
              <FormRow>
                <Field label="Hourly rate (₹)">
                  <Input
                    type="number"
                    value={form.technician.hourlyRate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        technician: { ...f.technician, hourlyRate: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="Availability">
                  <Select
                    value={form.technician.availability}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        technician: { ...f.technician, availability: e.target.value },
                      }))
                    }
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                    <option value="ON_LEAVE">On leave</option>
                  </Select>
                </Field>
              </FormRow>
            </div>
          ) : null}

          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-subtle uppercase">
              <ShieldCheck className="size-3.5" />
              {ROLE_LABELS[form.role]} can
            </p>
            {form.role === ROLES.SUPER_ADMIN ? (
              <p className="text-xs text-muted">Everything, including managing other admins.</p>
            ) : ROLE_PERMISSIONS[form.role].length ? (
              <div className="flex flex-wrap gap-1.5">
                {ROLE_PERMISSIONS[form.role].map((p) => (
                  <span
                    key={p}
                    className="rounded-md bg-surface px-2 py-0.5 font-mono text-[10px] text-muted"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">
                Customer portal only — their own vehicles, bookings and invoices.
              </p>
            )}
          </div>

          <Checkbox
            label="Account is active and can sign in"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={`Reset password for ${resetTarget?.name ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={newPassword.length < 8}
              onClick={resetPassword}
            >
              Set password
            </Button>
          </>
        }
      >
        <Field label="New password" required hint="At least 8 characters. Share it securely.">
          <Input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Temporary password"
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.name ?? 'account'}?`}
        message="They lose access immediately. Deactivating keeps the history tidier if they may return."
      />
    </>
  );
}
