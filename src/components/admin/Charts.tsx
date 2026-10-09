'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, formatCurrency, formatNumber, titleCase } from '@/lib/utils';

const AXIS = { fontSize: 11, fill: 'var(--text-subtle)' };

const SERIES = [
  'var(--brand)',
  'var(--accent)',
  'var(--success)',
  'var(--warning)',
  'var(--info)',
  'var(--danger)',
  'color-mix(in srgb, var(--brand) 55%, var(--accent))',
  'color-mix(in srgb, var(--accent) 55%, var(--info))',
];

function ChartTooltip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  label?: string | number;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-pop">
      {label !== undefined ? (
        <p className="mb-1 text-xs font-semibold text-ink">{label}</p>
      ) : null}
      {payload.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-xs text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {titleCase(String(p.name ?? ''))}:{' '}
          <span className="font-semibold text-ink">
            {money ? formatCurrency(Number(p.value)) : formatNumber(Number(p.value))}
          </span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
  height = 280,
}: {
  data: { month: string; billed: number; collected: number; jobs: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="billedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v / 1000}k`)}
        />
        <Tooltip content={<ChartTooltip money />} />
        <Area
          type="monotone"
          dataKey="billed"
          name="Billed"
          stroke="var(--brand)"
          strokeWidth={2}
          fill="url(#billedFill)"
        />
        <Area
          type="monotone"
          dataKey="collected"
          name="Collected"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#collectedFill)"
        />
        <Line type="monotone" dataKey="jobs" name="Jobs" stroke="var(--accent)" strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({
  data,
  height = 260,
}: {
  data: { status: string; count: number }[];
  height?: number;
}) {
  const shaped = data.map((d) => ({ name: titleCase(d.status), value: d.count }));
  const total = shaped.reduce((s, d) => s + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={shaped}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="var(--surface)"
            strokeWidth={2}
          >
            {shaped.map((_, i) => (
              <Cell key={i} fill={SERIES[i % SERIES.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs text-muted">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
        <p className="font-display text-2xl font-bold text-ink">{formatNumber(total)}</p>
        <p className="text-[10px] font-semibold tracking-wide text-subtle uppercase">Job cards</p>
      </div>
    </div>
  );
}

export function DailyBarChart({
  data,
  height = 260,
}: {
  data: { date: string; billed: number; collected: number }[];
  height?: number;
}) {
  const shaped = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={shaped} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v / 1000}k`)}
        />
        <Tooltip content={<ChartTooltip money />} cursor={{ fill: 'var(--surface-2)' }} />
        <Bar dataKey="billed" name="Billed" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="collected" name="Collected" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Lightweight horizontal bar list — no chart library needed. */
export function BarList({
  items,
  money = false,
  className,
}: {
  items: { label: string; value: number; meta?: string }[];
  money?: boolean;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className={cn('space-y-3.5', className)}>
      {items.map((item, i) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-ink">{item.label}</span>
            <span className="shrink-0 text-sm font-semibold text-ink">
              {money ? formatCurrency(item.value) : formatNumber(item.value)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  background: SERIES[i % SERIES.length],
                }}
              />
            </div>
            {item.meta ? (
              <span className="shrink-0 text-[11px] text-subtle">{item.meta}</span>
            ) : null}
          </div>
        </li>
      ))}
      {!items.length ? <li className="text-sm text-subtle">No data yet.</li> : null}
    </ul>
  );
}
