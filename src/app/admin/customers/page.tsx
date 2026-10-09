'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Pencil, Phone, Trash2, UserPlus } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Stat';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Checkbox, Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useCollection } from '@/hooks/useCollection';
import { apiDelete, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { formatCurrency, formatDate } from '@/lib/utils';

type Row = {
  _id: string;
  code: string;
  name: string;
  email?: string;
  phone: string;
  altPhone?: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  company?: string;
  gstin?: string;
  address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  notes?: string;
  tags?: string[];
  preferredContact: string;
  totalSpend: number;
  visitCount: number;
  lastVisitAt?: string;
  isActive: boolean;
};

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  altPhone: '',
  customerType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
  company: '',
  gstin: '',
  address: { line1: '', line2: '', city: '', state: '', pincode: '' },
  notes: '',
  preferredContact: 'PHONE',
  isActive: true,
};

export default function CustomersPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();

  const list = useCollection<Row>('/api/customers', { q: params.get('q') ?? '' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setErrors({});
    setForm({
      name: row.name,
      email: row.email ?? '',
      phone: row.phone,
      altPhone: row.altPhone ?? '',
      customerType: row.customerType,
      company: row.company ?? '',
      gstin: row.gstin ?? '',
      address: {
        line1: row.address?.line1 ?? '',
        line2: row.address?.line2 ?? '',
        city: row.address?.city ?? '',
        state: row.address?.state ?? '',
        pincode: row.address?.pincode ?? '',
      },
      notes: row.notes ?? '',
      preferredContact: row.preferredContact,
      isActive: row.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (editing) {
        await apiPatch(`/api/customers/${editing._id}`, form);
        toast.success('Customer updated');
      } else {
        await apiPost('/api/customers', form);
        toast.success('Customer added');
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

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/customers/${deleteTarget._id}`);
      toast.success('Customer deleted');
      setDeleteTarget(null);
      list.refresh();
    } catch (err) {
      toast.error('Delete failed', (err as ApiClientError).message);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
              {r.name}
              {r.customerType === 'BUSINESS' ? (
                <span title="Business account">
                  <Building2 className="size-3.5 shrink-0 text-accent" />
                </span>
              ) : null}
            </p>
            <p className="font-mono text-[11px] text-subtle">{r.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (r) => (
        <div className="min-w-0">
          <a
            href={`tel:${r.phone}`}
            className="flex items-center gap-1 text-sm text-ink hover:text-brand"
          >
            <Phone className="size-3" />
            {r.phone}
          </a>
          {r.email ? <p className="truncate text-[11px] text-muted">{r.email}</p> : null}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'City',
      hideBelow: 'md',
      render: (r) => <span className="text-sm text-muted">{r.address?.city || '—'}</span>,
    },
    {
      key: 'visits',
      header: 'Visits',
      hideBelow: 'md',
      render: (r) => (
        <div>
          <p className="text-sm font-semibold text-ink">{r.visitCount}</p>
          <p className="text-[11px] text-subtle">
            {r.lastVisitAt ? formatDate(r.lastVisitAt) : 'Never'}
          </p>
        </div>
      ),
    },
    {
      key: 'spend',
      header: 'Lifetime spend',
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-sm font-semibold text-ink">{formatCurrency(r.totalSpend)}</span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      hideBelow: 'lg',
      render: (r) =>
        r.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {r.tags.map((t) => (
              <Badge key={t} tone="brand">
                {t}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-subtle">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.isActive ? 'success' : 'neutral'} dot>
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
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
            onClick={() => router.push(`/admin/customers/${r._id}`)}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-brand transition hover:bg-brand-soft"
          >
            Open
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
        title="Customers"
        description="Every person and business on your books, with their spend and visit history."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Customers' }]}
        action={
          <Button onClick={openCreate}>
            <UserPlus className="size-4" />
            Add customer
          </Button>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Name, phone, email or code…"
          />
          <FilterSelect
            label="Type"
            value={String(list.params.customerType ?? 'ALL')}
            onChange={(v) => list.setParam('customerType', v)}
            options={[
              { value: 'INDIVIDUAL', label: 'Individual' },
              { value: 'BUSINESS', label: 'Business' },
            ]}
          />
          <FilterSelect
            label="Status"
            value={String(list.params.isActive ?? 'ALL')}
            onChange={(v) => list.setParam('isActive', v)}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
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
          emptyTitle="No customers found"
          emptyMessage="Add your first customer, or adjust the filters."
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
        title={editing ? `Edit ${editing.name}` : 'Add customer'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              {editing ? 'Save changes' : 'Add customer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <Field label="Account type">
              <Select
                value={form.customerType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    customerType: e.target.value as 'INDIVIDUAL' | 'BUSINESS',
                  }))
                }
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="BUSINESS">Business / fleet</option>
              </Select>
            </Field>
            <Field label="Preferred contact">
              <Select
                value={form.preferredContact}
                onChange={(e) => setForm((f) => ({ ...f, preferredContact: e.target.value }))}
              >
                {['PHONE', 'WHATSAPP', 'SMS', 'EMAIL'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Full name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Phone" required error={errors.phone}>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field label="Alternate phone">
              <Input
                value={form.altPhone}
                onChange={(e) => setForm((f) => ({ ...f, altPhone: e.target.value }))}
              />
            </Field>
          </FormRow>

          {form.customerType === 'BUSINESS' ? (
            <FormRow>
              <Field label="Company name" error={errors.company}>
                <Input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </Field>
              <Field label="GSTIN" error={errors.gstin}>
                <Input
                  value={form.gstin}
                  onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                  className="uppercase"
                />
              </Field>
            </FormRow>
          ) : null}

          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <p className="mb-3 text-xs font-bold tracking-wide text-subtle uppercase">Address</p>
            <div className="space-y-3">
              <Field label="Address line 1">
                <Input
                  value={form.address.line1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: { ...f.address, line1: e.target.value } }))
                  }
                />
              </Field>
              <FormRow cols={3}>
                <Field label="City">
                  <Input
                    value={form.address.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="State">
                  <Input
                    value={form.address.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))
                    }
                  />
                </Field>
                <Field label="Pincode">
                  <Input
                    value={form.address.pincode}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: { ...f.address, pincode: e.target.value } }))
                    }
                  />
                </Field>
              </FormRow>
            </div>
          </div>

          <Field label="Internal notes" hint="Not visible to the customer.">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>

          <Checkbox
            label="Account is active"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.name ?? 'customer'}?`}
        message="Their vehicles, job cards and invoices stay in the system but will no longer be linked to a live customer record."
      />
    </>
  );
}
