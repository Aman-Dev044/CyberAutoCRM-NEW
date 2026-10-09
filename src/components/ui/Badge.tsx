import { cn, titleCase } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const TONES: Record<Tone, string> = {
  neutral: 'border-line-strong bg-surface-2 text-muted',
  brand: 'border-brand/35 bg-brand-soft text-brand',
  success: 'border-success/35 bg-success-soft text-success',
  warning: 'border-warning/35 bg-warning-soft text-warning',
  danger: 'border-danger/35 bg-danger-soft text-danger',
  info: 'border-info/35 bg-info-soft text-info',
  accent: 'border-accent/35 bg-accent/10 text-accent',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  dot = false,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  // appointments
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'brand',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
  // service orders
  OPEN: 'neutral',
  DIAGNOSING: 'info',
  AWAITING_PARTS: 'warning',
  QUALITY_CHECK: 'accent',
  READY: 'success',
  DELIVERED: 'success',
  // invoices
  DRAFT: 'neutral',
  SENT: 'info',
  PARTIAL: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  VOID: 'neutral',
  // priority
  LOW: 'neutral',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
  // availability / roles
  AVAILABLE: 'success',
  BUSY: 'warning',
  ON_LEAVE: 'neutral',
  SUPER_ADMIN: 'danger',
  ADMIN: 'accent',
  MANAGER: 'info',
  TECHNICIAN: 'brand',
  CUSTOMER: 'neutral',
  NEW: 'brand',
  READ: 'info',
  REPLIED: 'success',
  ARCHIVED: 'neutral',
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return <Badge className={className}>—</Badge>;
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot className={className}>
      {titleCase(status)}
    </Badge>
  );
}
