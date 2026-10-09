'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Minus, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton, SearchInput } from '@/components/admin/Filters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/Stat';
import { Column, DataTable, Pagination } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Checkbox, Field, FormRow, Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useCollection } from '@/hooks/useCollection';
import { apiDelete, apiPatch, apiPost, fieldErrors, type ApiClientError } from '@/lib/client';
import { formatCurrency, formatNumber } from '@/lib/utils';

type Row = {
  _id: string;
  sku: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  unit: string;
  costPrice: number;
  unitPrice: number;
  stockQty: number;
  reorderLevel: number;
  rackLocation?: string;
  supplier?: string;
  isActive: boolean;
};

const EMPTY = {
  sku: '',
  name: '',
  category: 'General',
  brand: '',
  description: '',
  unit: 'pc',
  costPrice: '0',
  unitPrice: '0',
  stockQty: '0',
  reorderLevel: '5',
  rackLocation: '',
  supplier: '',
  isActive: true,
};

export default function PartsPage() {
  const toast = useToast();
  const params = useSearchParams();
  const list = useCollection<Row>('/api/parts', { limit: 50 });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [onlyLowStock, setOnlyLowStock] = useState(params.get('lowStock') === '1');

  const rows = useMemo(
    () => (onlyLowStock ? list.items.filter((p) => p.stockQty <= p.reorderLevel) : list.items),
    [list.items, onlyLowStock],
  );

  const totals = useMemo(
    () =>
      list.items.reduce(
        (acc, p) => ({
          stockValue: acc.stockValue + p.stockQty * p.costPrice,
          retailValue: acc.retailValue + p.stockQty * p.unitPrice,
          low: acc.low + (p.stockQty <= p.reorderLevel ? 1 : 0),
        }),
        { stockValue: 0, retailValue: 0, low: 0 },
      ),
    [list.items],
  );

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
      sku: row.sku,
      name: row.name,
      category: row.category,
      brand: row.brand ?? '',
      description: row.description ?? '',
      unit: row.unit,
      costPrice: String(row.costPrice),
      unitPrice: String(row.unitPrice),
      stockQty: String(row.stockQty),
      reorderLevel: String(row.reorderLevel),
      rackLocation: row.rackLocation ?? '',
      supplier: row.supplier ?? '',
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
        costPrice: Number(form.costPrice),
        unitPrice: Number(form.unitPrice),
        stockQty: Number(form.stockQty),
        reorderLevel: Number(form.reorderLevel),
      };
      if (editing) {
        await apiPatch(`/api/parts/${editing._id}`, payload);
        toast.success('Part updated');
      } else {
        await apiPost('/api/parts', payload);
        toast.success('Part added to stock');
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

  const adjustStock = async (row: Row, delta: number) => {
    const next = Math.max(0, row.stockQty + delta);
    try {
      await apiPatch(`/api/parts/${row._id}`, { stockQty: next });
      list.refresh();
    } catch (err) {
      toast.error('Stock update failed', (err as ApiClientError).message);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/parts/${deleteTarget._id}`);
      toast.success('Part deleted');
      setDeleteTarget(null);
      list.refresh();
    } catch (err) {
      toast.error('Delete failed', (err as ApiClientError).message);
    }
  };

  const columns: Column<Row>[] = [
    {
      key: 'part',
      header: 'Part',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
          <p className="font-mono text-[11px] text-subtle">
            {r.sku}
            {r.brand ? ` · ${r.brand}` : ''}
          </p>
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
      key: 'stock',
      header: 'Stock',
      render: (r) => {
        const low = r.stockQty <= r.reorderLevel;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustStock(r, -1)}
              className="grid size-6 place-items-center rounded-md border border-line text-muted transition hover:border-danger hover:text-danger"
              aria-label="Decrease stock"
            >
              <Minus className="size-3" />
            </button>
            <span
              className={`w-14 text-center text-sm font-bold ${low ? 'text-danger' : 'text-ink'}`}
            >
              {r.stockQty} {r.unit}
            </span>
            <button
              type="button"
              onClick={() => adjustStock(r, 1)}
              className="grid size-6 place-items-center rounded-md border border-line text-muted transition hover:border-success hover:text-success"
              aria-label="Increase stock"
            >
              <Plus className="size-3" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'reorder',
      header: 'Reorder at',
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-xs text-muted">
          {r.reorderLevel}
          {r.stockQty <= r.reorderLevel ? (
            <Badge tone="danger" className="ml-2">
              Reorder
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: 'pricing',
      header: 'Cost / retail',
      render: (r) => (
        <div>
          <p className="text-sm font-semibold text-ink">{formatCurrency(r.unitPrice)}</p>
          <p className="text-[11px] text-subtle">
            cost {formatCurrency(r.costPrice)} ·{' '}
            {r.unitPrice > 0
              ? `${Math.round(((r.unitPrice - r.costPrice) / r.unitPrice) * 100)}% margin`
              : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'rack',
      header: 'Rack',
      hideBelow: 'lg',
      render: (r) => (
        <span className="font-mono text-xs text-muted">{r.rackLocation || '—'}</span>
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
        title="Parts & stock"
        description="Inventory with reorder alerts, rack locations and margin per line."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Parts & Stock' }]}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add part
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Stock value (at cost)"
          value={formatCurrency(totals.stockValue)}
          icon={<Package className="size-5" />}
        />
        <StatCard
          label="Retail value"
          value={formatCurrency(totals.retailValue)}
          icon={<Package className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Need reordering"
          value={totals.low}
          icon={<AlertTriangle className="size-5" />}
          tone={totals.low ? 'danger' : 'info'}
          footer={`${formatNumber(list.total)} SKUs tracked`}
        />
      </div>

      <Card>
        <Toolbar>
          <SearchInput
            value={String(list.params.q ?? '')}
            onChange={(v) => list.setParam('q', v)}
            placeholder="Name, SKU or brand…"
          />
          <FilterSelect
            label="Status"
            value={String(list.params.isActive ?? 'ALL')}
            onChange={(v) => list.setParam('isActive', v)}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Discontinued' },
            ]}
          />
          <Checkbox
            label="Only low stock"
            checked={onlyLowStock}
            onChange={(e) => setOnlyLowStock(e.target.checked)}
          />
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={rows}
          loading={list.loading}
          emptyTitle={onlyLowStock ? 'Everything is in stock' : 'No parts yet'}
          emptyMessage={
            onlyLowStock
              ? 'Nothing is at or below its reorder level.'
              : 'Add the parts you keep on the shelf.'
          }
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
        title={editing ? `Edit ${editing.name}` : 'Add part'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={save}>
              {editing ? 'Save changes' : 'Add part'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <Field label="SKU" required error={errors.sku}>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                className="font-mono uppercase"
                placeholder="BRK-PAD-F22"
              />
            </Field>
            <Field label="Part name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Front Brake Pad Set"
              />
            </Field>
          </FormRow>

          <FormRow cols={3}>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </Field>
            <Field label="Brand">
              <Input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </Field>
            <Field label="Unit">
              <Input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="pc / L / set"
              />
            </Field>
          </FormRow>

          <FormRow cols={4}>
            <Field label="Cost price (₹)">
              <Input
                type="number"
                value={form.costPrice}
                onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
              />
            </Field>
            <Field label="Retail price (₹)" required error={errors.unitPrice}>
              <Input
                type="number"
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
              />
            </Field>
            <Field label="Stock on hand">
              <Input
                type="number"
                value={form.stockQty}
                onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))}
              />
            </Field>
            <Field label="Reorder level">
              <Input
                type="number"
                value={form.reorderLevel}
                onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
              />
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Rack location">
              <Input
                value={form.rackLocation}
                onChange={(e) => setForm((f) => ({ ...f, rackLocation: e.target.value }))}
                placeholder="R4-B2"
              />
            </Field>
            <Field label="Supplier">
              <Input
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              />
            </Field>
          </FormRow>

          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <Checkbox
            label="Part is active and can be added to job cards"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title={`Delete ${deleteTarget?.sku ?? 'part'}?`}
        message="Job cards keep the part line they already recorded. Prefer marking it inactive if you may stock it again."
      />
    </>
  );
}
