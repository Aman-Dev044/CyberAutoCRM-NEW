import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Wordmark + mark. The mark is inline SVG so it inherits the theme tokens. */
export function Logo({
  href = '/',
  compact = false,
  className,
  tone = 'default',
}: {
  href?: string | null;
  compact?: boolean;
  className?: string;
  tone?: 'default' | 'light';
}) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent text-brand-contrast shadow-[0_6px_20px_-8px_color-mix(in_srgb,var(--brand)_80%,transparent)]">
        <svg viewBox="0 0 24 24" fill="none" className="size-5.5" aria-hidden>
          <path
            d="M3 14.5 4.6 9.2A3 3 0 0 1 7.5 7h9a3 3 0 0 1 2.9 2.2L21 14.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 14.5h18v3a1.5 1.5 0 0 1-1.5 1.5H18a1.5 1.5 0 0 1-1.5-1.5v-.5h-9v.5A1.5 1.5 0 0 1 6 19H4.5A1.5 1.5 0 0 1 3 17.5v-3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11.2" r="1.6" fill="currentColor" />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-[1.05rem] font-extrabold tracking-tight',
              tone === 'light' ? 'text-white' : 'text-ink',
            )}
          >
            Cyber<span className="text-brand">Auto</span>Suite
          </span>
          <span
            className={cn(
              'mt-1 text-[10px] font-semibold tracking-[0.18em] uppercase',
              tone === 'light' ? 'text-white/55' : 'text-subtle',
            )}
          >
            Service CRM
          </span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="shrink-0" aria-label="CyberAutoSuite home">
      {content}
    </Link>
  );
}
