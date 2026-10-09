import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn, initials } from '@/lib/utils';

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  tone = 'brand',
  footer,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  footer?: React.ReactNode;
}) {
  const toneMap = {
    brand: 'bg-brand-soft text-brand',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    accent: 'bg-accent/10 text-accent',
  };

  const up = (delta ?? 0) >= 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card transition-all hover:border-brand/40 hover:shadow-float">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-wide text-muted uppercase">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-ink sm:text-[1.75rem]">{value}</p>
        </div>
        {icon ? (
          <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', toneMap[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      {typeof delta === 'number' ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold',
              up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-subtle">{deltaLabel ?? 'vs last month'}</span>
        </div>
      ) : null}
      {footer ? <div className="mt-3 text-xs text-muted">{footer}</div> : null}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    xs: 'size-7 text-[10px]',
    sm: 'size-9 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-14 text-base',
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-xl object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand/25 to-accent/25 font-bold text-brand',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name) || '?'}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = 'brand',
  className,
}: {
  value: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const toneMap = {
    brand: 'bg-brand',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-3', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', toneMap[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
