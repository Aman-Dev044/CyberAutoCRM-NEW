'use client';

import { useState } from 'react';
import { Pencil, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { ServiceIcon } from '@/components/site/ServiceIcon';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Checkbox, Field, FormRow, Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useCollection } from '@/hooks/useCollection';
import { apiDelete, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

type Row = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  estimatedHours: number;
  includes?: string[];
  icon?: string;
  isFeatured: boolean;
  isActive: boolean;
  bookingCount: number;
};

const ICONS = [
  'wrench', 'droplet', 'activity', 'disc', 'snowflake', 'circle-dot',
  'battery-charging', 'cog', 'sparkles', 'hammer', 'move-vertical',
  'search-check', 'lightbulb', 'zap',
];

const EMPTY = {
  name: '',
  category: 'Maintenance',
  shortDescription: '',
  description: '',
  basePrice: '0',
  estimatedHours: '1',
  includes: '',
  icon: 'wrench',
  isFeatured: false,
  isActive: true,
};

export default function ServicesPage() {
  const toast = useToast();
  const list = useCollection<Row>('/api/services', { limit: 50 });

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
      category: row.category,
      shortDescription: row.shortDescription ?? '',
      description: row.description ?? '',
      basePrice: String(row.basePrice),
      estimatedHours: String(row.estimatedHours),
      includes: (row.includes ?? []).join('\n'),
      icon: row.icon ?? 'wrench',
      isFeatured: row.isFeatured,
      isActive: row.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        basePrice: Number(form.basePrice),
        estimatedHours: Number(form.estimatedHours),
        includes: form.includes
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editing) {
        await apiPatch(`/api/services/${editing._id}`, payload);
        toast.success('Service updated');
      } else {
        await apiPost('/api/services', payload);
        toast.success('Service added to the catalogue');
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

  const toggleActive = async (row: Row) => {
    try {
      await apiPatch(`/api/services/${row._id}`, { isActive: !row.isActive });
      toast.success(row.isActive ? 'Service hidden from the site' : 'Service is live');
      list.refresh();
    } catch (err) {
      toast.error('Update failed', (err as ApiClientError).message);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/services/${deleteTarget._id}`);
      toast.success('Service deleted');
      setDeleteTarget(null);
      list.refresh();
    } catch (err) {
      toast.error('Delete failed', (err as ApiClientError).message);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Service',
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <ServiceIcon name={r.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              {r.name}
              {r.isFeatured ? (
                <span title="Featured on the homepage">
                  <Star className="size-3 shrink-0 fill-warning text-warning" />
                </span>
              ) : null}
            </p>
            <p className="max-w-80 truncate text-[11px] text-muted">{r.shortDescription}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'md',
      render: (r) => <Badge tone="accent">{r.category}</Badge>,
    },
    {
      key: 'price',
      header: 'Starting price',
      render: (r) => (
        <div>
          <p className="text-sm font-bold text-ink">{formatCurrency(r.basePrice)}</p>
          <p className="text-[11px] text-subtle">approx {r.estimatedHours}h</p>
        </div>
      ),
    },
    {
      key: 'bookings',
      header: 'Bookings',
      hideBelow: 'md',
      render: (r) => <span className="text-sm text-ink">{r.bookingCount}</span>,
    },
    {
      key: 'status',
      header: 'Visible',
      render: (r) => (
        <button type="button" onClick={() => toggleActive(r)} title="Toggle visibility">
          <Badge tone={r.isActive ? 'success' : 'neutral'} dot>
            {r.isActive ? 'Live' : 'Hidden'}
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
        title="Service catalogue"
        description="What customers can book online, with starting prices and workshop time."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Services' }]}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add service
          </Button>
        }
      />

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Search services…"
          />
          <FilterSelect
            label="Category"
            value={String(list.params.category ?? 'ALL')}
            onChange={(v) => list.setParam('category', v)}
            options={SERVICE_CATEGORIES}
          />
          <FilterSelect
            label="Visibility"
            value={String(list.params.isActive ?? 'ALL')}
            onChange={(v) => list.setParam('isActive', v)}
            options={[
              { value: 'true', label: 'Live' },
              { value: 'false', label: 'Hidden' },
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
          emptyTitle="No services yet"
          emptyMessage="Add the services your workshop offers so customers can book them."
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
        title={editing ? `Edit ${editing.name}` : 'Add service'}
        description="Everything here is visible on the public site."
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              {editing ? 'Save changes' : 'Add service'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <Field label="Service name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Comprehensive Periodic Service"
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormRow cols={3}>
            <Field label="Starting price (₹)" required error={errors.basePrice}>
              <Input
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
              />
            </Field>
            <Field label="Workshop hours" error={errors.estimatedHours}>
              <Input
                type="number"
                step="0.25"
                value={form.estimatedHours}
                onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
              />
            </Field>
            <Field label="Icon">
              <Select
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              >
                {ICONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <Field
            label="Short description"
            hint="One line, shown on cards. Keep it concrete."
            error={errors.shortDescription}
          >
            <Input
              value={form.shortDescription}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              placeholder="Full 42-point service with engine oil, all filters and fluid top-ups."
            />
          </Field>

          <Field label="Full description" error={errors.description}>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <Field label="What's included" hint="One item per line.">
            <Textarea
              rows={4}
              value={form.includes}
              onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))}
              placeholder={'Engine oil + filter\nAir & cabin filter\nBrake inspection'}
            />
          </Field>

          <div className="flex flex-wrap gap-5 rounded-xl border border-line bg-surface-2/40 p-4">
            <Checkbox
              label="Feature on the homepage"
              checked={form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            />
            <Checkbox
              label="Bookable online"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.name ?? 'service'}?`}
        message="Job cards that already reference it keep their line items. Consider hiding it instead."
      />

      <p className="mt-4 flex items-center gap-2 text-xs text-subtle">
        <Sparkles className="size-3.5 text-brand" />
        Featured services appear on the homepage grid; hidden ones disappear from booking instantly.
      </p>
    </>
  );
}
