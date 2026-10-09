'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Mail, Phone, Star, UserPlus, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { RefreshButton } from '@/components/admin/Filters';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, ProgressBar, StatCard } from '@/components/ui/Stat';
import { EmptyState } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiGet, apiPatch, type ApiClientError } from '@/lib/client';
import { formatCurrency } from '@/lib/utils';

type Tech = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  openJobs: number;
  technician?: {
    employeeId?: string;
    specialization?: string;
    skills?: string[];
    hourlyRate?: number;
    availability?: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
    rating?: number;
    jobsCompleted?: number;
  };
};

export default function TechniciansPage() {
  const toast = useToast();
  const [items, setItems] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiGet<{ items: Tech[] }>('/api/technicians')
      .then((r) => setItems(r.items))
      .catch((err) => toast.error('Could not load the roster', (err as ApiClientError).message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const setAvailability = async (tech: Tech, availability: string) => {
    try {
      await apiPatch(`/api/users/${tech._id}`, { technician: { availability } });
      toast.success(`${tech.name.split(' ')[0]} is now ${availability.toLowerCase().replace('_', ' ')}`);
      load();
    } catch (err) {
      toast.error('Could not update availability', (err as ApiClientError).message);
    }
  };

  const totalOpen = items.reduce((s, t) => s + t.openJobs, 0);
  const totalDone = items.reduce((s, t) => s + (t.technician?.jobsCompleted ?? 0), 0);
  const avgRating = items.length
    ? items.reduce((s, t) => s + (t.technician?.rating ?? 0), 0) / items.length
    : 0;

  return (
    <>
      <PageHeader
        title="Technicians"
        description="Who is on the floor, what they specialise in and how loaded they are right now."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Technicians' }]}
        action={
          <>
            <RefreshButton onClick={load} loading={loading} />
            <Link
              href="/admin/users?role=TECHNICIAN"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast transition hover:brightness-110"
            >
              <UserPlus className="size-4" />
              Add technician
            </Link>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="On the roster" value={items.length} icon={<Briefcase className="size-5" />} />
        <StatCard
          label="Open jobs assigned"
          value={totalOpen}
          icon={<Wrench className="size-5" />}
          tone="warning"
        />
        <StatCard
          label="Jobs completed"
          value={totalDone}
          icon={<Wrench className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Average rating"
          value={avgRating ? `${avgRating.toFixed(1)} / 5` : '—'}
          icon={<Star className="size-5" />}
          tone="accent"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => {
            const loadPct = Math.min(100, (t.openJobs / 5) * 100);
            const availability = t.technician?.availability ?? 'AVAILABLE';
            return (
              <Card key={t._id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      {t.name}
                      {t.technician?.employeeId ? (
                        <span className="font-mono text-[10px] text-subtle">
                          {t.technician.employeeId}
                        </span>
                      ) : null}
                    </span>
                  }
                  subtitle={t.technician?.specialization ?? 'General technician'}
                  icon={<Avatar name={t.name} src={t.avatarUrl} size="sm" />}
                  action={
                    <Badge
                      tone={
                        availability === 'AVAILABLE'
                          ? 'success'
                          : availability === 'BUSY'
                            ? 'warning'
                            : 'neutral'
                      }
                      dot
                    >
                      {availability.replace('_', ' ')}
                    </Badge>
                  }
                />
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {(t.technician?.skills ?? []).map((s) => (
                      <Badge key={s} tone="brand">
                        {s}
                      </Badge>
                    ))}
                    {!t.technician?.skills?.length ? (
                      <span className="text-xs text-subtle">No skills recorded</span>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted">Current load</span>
                      <span className="font-semibold text-ink">
                        {t.openJobs} open job{t.openJobs === 1 ? '' : 's'}
                      </span>
                    </div>
                    <ProgressBar
                      value={loadPct}
                      tone={loadPct > 80 ? 'danger' : loadPct > 50 ? 'warning' : 'success'}
                    />
                  </div>

                  <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                    <div>
                      <dt className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
                        Rate
                      </dt>
                      <dd className="mt-0.5 text-sm font-bold text-ink">
                        {formatCurrency(t.technician?.hourlyRate ?? 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
                        Done
                      </dt>
                      <dd className="mt-0.5 text-sm font-bold text-ink">
                        {t.technician?.jobsCompleted ?? 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold tracking-wide text-subtle uppercase">
                        Rating
                      </dt>
                      <dd className="mt-0.5 flex items-center justify-center gap-1 text-sm font-bold text-ink">
                        <Star className="size-3 fill-warning text-warning" />
                        {t.technician?.rating ?? '—'}
                      </dd>
                    </div>
                  </dl>

                  <div className="space-y-1.5 border-t border-line pt-3 text-xs">
                    <a
                      href={`mailto:${t.email}`}
                      className="flex items-center gap-2 text-muted hover:text-brand"
                    >
                      <Mail className="size-3.5" />
                      <span className="truncate">{t.email}</span>
                    </a>
                    {t.phone ? (
                      <a
                        href={`tel:${t.phone}`}
                        className="flex items-center gap-2 text-muted hover:text-brand"
                      >
                        <Phone className="size-3.5" />
                        {t.phone}
                      </a>
                    ) : null}
                  </div>

                  <Select
                    value={availability}
                    onChange={(e) => setAvailability(t, e.target.value)}
                    className="h-9 text-xs"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                    <option value="ON_LEAVE">On leave</option>
                  </Select>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Briefcase className="size-6" />}
            title="No technicians yet"
            message="Create technician accounts from Users & Roles so they can be assigned to job cards."
          />
        </Card>
      )}
    </>
  );
}
