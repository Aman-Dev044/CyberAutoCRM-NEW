'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Archive, Inbox, Mail, MailOpen, Phone, Reply, Trash2 } from 'lucide-react';
import { PageHeader, Toolbar } from '@/components/admin/PageHeader';
import { FilterSelect, RefreshButton } from '@/components/admin/Filters';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, Pagination } from '@/components/ui/DataTable';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Field, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useCollection } from '@/hooks/useCollection';
import { apiDelete, apiPatch, type ApiClientError } from '@/lib/client';
import { cn, formatDate, relativeTime } from '@/lib/utils';

type Row = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  reply?: string;
  createdAt: string;
};

export default function MessagesPage() {
  const toast = useToast();
  const params = useSearchParams();

  const list = useCollection<Row>('/api/messages', {
    status: params.get('status') ?? 'ALL',
    limit: 25,
  });

  const [active, setActive] = useState<Row | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const open = async (row: Row) => {
    setActive(row);
    setReply(row.reply ?? '');
    if (row.status === 'NEW') {
      await apiPatch(`/api/messages/${row._id}`, { status: 'READ' }).catch(() => {});
      list.refresh();
    }
  };

  const sendReply = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await apiPatch(`/api/messages/${active._id}`, { reply, status: 'REPLIED' });
      toast.success('Reply saved', 'Logged against the enquiry for the record.');
      setActive(null);
      list.refresh();
    } catch (err) {
      toast.error('Could not save the reply', (err as ApiClientError).message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (row: Row, status: string) => {
    try {
      await apiPatch(`/api/messages/${row._id}`, { status });
      list.refresh();
    } catch (err) {
      toast.error('Update failed', (err as ApiClientError).message);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/messages/${deleteTarget._id}`);
      toast.success('Enquiry deleted');
      setDeleteTarget(null);
      list.refresh();
    } catch (err) {
      toast.error('Delete failed', (err as ApiClientError).message);
    }
  };

  const unread = (list.data?.unread as number) ?? 0;

  return (
    <>
      <PageHeader
        title="Enquiries"
        description={
          unread
            ? `${unread} new message${unread === 1 ? '' : 's'} waiting on a reply`
            : 'Everything from the website contact form.'
        }
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Enquiries' }]}
      />

      <Card>
        <Toolbar>
          <FilterSelect
            label="Status"
            value={String(list.params.status ?? 'ALL')}
            onChange={(v) => list.setParam('status', v)}
            options={['NEW', 'READ', 'REPLIED', 'ARCHIVED']}
          />
          <div className="ml-auto">
            <RefreshButton onClick={list.refresh} loading={list.loading} />
          </div>
        </Toolbar>

        {list.loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : list.items.length ? (
          <ul className="divide-y divide-line">
            {list.items.map((m) => (
              <li
                key={m._id}
                className={cn(
                  'flex gap-4 px-5 py-4 transition hover:bg-surface-2/50',
                  m.status === 'NEW' && 'bg-brand-soft/30',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl',
                    m.status === 'NEW' ? 'bg-brand text-brand-contrast' : 'bg-surface-2 text-muted',
                  )}
                >
                  {m.status === 'NEW' ? (
                    <Mail className="size-5" />
                  ) : (
                    <MailOpen className="size-5" />
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => open(m)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{m.subject}</p>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {m.name} · {m.email}
                    {m.phone ? ` · ${m.phone}` : ''} · {relativeTime(m.createdAt)}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">{m.message}</p>
                </button>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => open(m)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-brand-soft hover:text-brand"
                    title="Reply"
                  >
                    <Reply className="size-4" />
                  </button>
                  {m.status !== 'ARCHIVED' ? (
                    <button
                      type="button"
                      onClick={() => setStatus(m, 'ARCHIVED')}
                      className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
                      title="Archive"
                    >
                      <Archive className="size-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(m)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Inbox className="size-6" />}
            title="Inbox is clear"
            message="New website enquiries land here."
          />
        )}

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          onPage={(p) => list.setParam('page', p)}
        />
      </Card>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.subject ?? ''}
        description={active ? `${active.name} · ${formatDate(active.createdAt, true)}` : undefined}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setActive(null)}>
              Close
            </Button>
            <Button size="sm" loading={saving} onClick={sendReply}>
              <Reply className="size-4" />
              Save reply
            </Button>
          </>
        }
      >
        {active ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-4 rounded-xl border border-line bg-surface-2/40 p-4 text-sm">
              <a
                href={`mailto:${active.email}`}
                className="flex items-center gap-2 text-ink hover:text-brand"
              >
                <Mail className="size-4 text-muted" />
                {active.email}
              </a>
              {active.phone ? (
                <a
                  href={`tel:${active.phone}`}
                  className="flex items-center gap-2 text-ink hover:text-brand"
                >
                  <Phone className="size-4 text-muted" />
                  {active.phone}
                </a>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-bold tracking-wide text-subtle uppercase">Their message</p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                {active.message}
              </p>
            </div>

            <Field
              label="Your reply"
              hint="Stored on the enquiry so anyone at the desk can see what was promised."
            >
              <Textarea
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Thanks for reaching out — yes, we can fit you in on…"
              />
            </Field>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete this enquiry?"
        message="It will be removed permanently. Archive it instead if you may need it later."
      />
    </>
  );
}
